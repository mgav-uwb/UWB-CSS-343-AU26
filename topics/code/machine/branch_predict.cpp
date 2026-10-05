// CSS 343 · topic program: the same count, a different constant (branch prediction).
//   g++ -std=c++17 -O2 branch_predict.cpp -o branch_predict && ./branch_predict
// Sums the elements >= 128 of 16M random bytes, first in random order, then
// sorted. Both loops execute exactly the same instructions the same number of
// times; only the predictability of the if differs. The empty asm statement
// keeps the if a real branch: without it the compiler may replace the branch
// by a conditional move, and then both orders run equally fast.

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <random>
#include <vector>
using namespace std;

int main() {
    const int N = 1 << 24;
    vector<int> a(N);
    mt19937 rng(7);
    for (int& x : a) x = (int)(rng() % 256);

    auto best = [&](const vector<int>& v, long long& s) {
        double t = 1e18;
        for (int r = 0; r < 5; r++) {
            auto t0 = chrono::steady_clock::now();
            s = 0;
            for (int x : v) {
                if (x >= 128) { s += x; asm volatile("" ::: "memory"); }   // keep it a branch
            }
            auto t1 = chrono::steady_clock::now();
            t = min(t, chrono::duration<double>(t1 - t0).count());
        }
        return t;
    };
    long long s1, s2;
    double unsorted = best(a, s1);
    vector<int> b = a;
    sort(b.begin(), b.end());
    double sorted = best(b, s2);
    printf("N = %d: unsorted %.4f s, sorted %.4f s, ratio %.1fx (sums %lld, %lld)\n",
           N, unsorted, sorted, unsorted / sorted, s1, s2);
}
