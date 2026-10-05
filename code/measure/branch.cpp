// CSS 343 · program: the same work, with a branch the processor can or cannot predict.
//
// Two experiments over the same 16,777,216 random values in 0..255, each run on
// the values in random order and then on the same values sorted:
//   1. sum the values >= 128. The test is simple enough that the optimizer
//      replaces the branch with branch-free instructions, so the order of the
//      values makes no difference.
//   2. the same test guarding a call to a function the compiler does not inline,
//      so the branch stays. On random data the processor guesses its direction
//      wrongly about half the time and discards the work it did on each wrong
//      guess; on sorted data the guess is almost always right.
// The work is identical in both orders; only the predictability of the branch differs.
//
// Build & run:  g++ -std=c++17 -O2 branch.cpp -o branch && ./branch

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <vector>
using namespace std;

static uint64_t rng = 88172645463325252ull;
static uint64_t nextRand() { rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17; return rng; }

__attribute__((noinline)) static long long weight(int x) { return x * 3LL + 1; }

static long long sumSimple(const vector<int>& a) {
    long long s = 0;
    for (size_t i = 0; i < a.size(); i++)
        if (a[i] >= 128) s += a[i];
    return s;
}
static long long sumCall(const vector<int>& a) {
    long long s = 0;
    for (size_t i = 0; i < a.size(); i++)
        if (a[i] >= 128) s += weight(a[i]);
    return s;
}

// fastest of 5 runs; the empty asm statements stop the optimizer from moving
// the call out of the timed region or reusing an earlier result
template <class F> static double fastest(F f, long long& out) {
    double best = 1e30;
    for (int t = 0; t < 5; t++) {
        asm volatile("" ::: "memory");
        auto t0 = chrono::steady_clock::now();
        long long s = f();
        asm volatile("" : "+r"(s) :: "memory");
        best = min(best, chrono::duration<double>(chrono::steady_clock::now() - t0).count());
        out = s;
    }
    return best;
}

int main() {
    const size_t n = 1 << 24;
    vector<int> a(n);
    for (int& x : a) x = (int)(nextRand() % 256);
    vector<int> sorted = a;
    sort(sorted.begin(), sorted.end());

    long long s1, s2;
    struct { const char* name; long long (*f)(const vector<int>&); } exps[] = {
        { "1. simple sum (branch removed by -O2)", sumSimple },
        { "2. branch guarding a call", sumCall },
    };
    for (auto& e : exps) {
        double tr = fastest([&] { return e.f(a); }, s1);
        double ts = fastest([&] { return e.f(sorted); }, s2);
        printf("%s\n", e.name);
        printf("   random order %.4f s  %.2f ns per value\n", tr, tr * 1e9 / n);
        printf("   sorted       %.4f s  %.2f ns per value  (sums %s)\n", ts, ts * 1e9 / n, s1 == s2 ? "agree" : "DIFFER");
        printf("   random / sorted = %.1fx\n", tr / ts);
    }
}
