// CSS 343 · topic program: 3-sum and the doubling experiment
//
// The 3-sum problem: count the triples (i<j<k) with a[i]+a[j]+a[k] == 0.
// We instrument the algorithm to COUNT operations (exact, machine-independent)
// and also TIME it (real-world validation), then run a doubling experiment:
// double N and watch the ratio. For a cubic algorithm the ratio -> 8.
//
// Build & run:
//   g++ -std=c++17 -O2 threesum.cpp -o threesum && ./threesum
//
//   ./threesum          # doubling experiment, N = 250 .. 2000
//   ./threesum 4000     # go up to N = 4000 (slower)

#include <cstdio>
#include <cstdlib>
#include <vector>
#include <random>
#include <chrono>
using namespace std;

// Brute-force 3-sum. Counts the inner-loop tests (the "operations") in `ops`.
long count3(const vector<int>& a, long long& ops) {
    int N = (int)a.size();
    long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            for (int k = j + 1; k < N; k++) {
                ops++;                                  // the inner loop
                if (a[i] + a[j] + a[k] == 0)
                    cnt++;
            }
    return cnt;
}

vector<int> randomInts(int N, mt19937& rng) {
    uniform_int_distribution<int> dist(-1000000, 1000000);
    vector<int> a(N);
    for (int& x : a) x = dist(rng);
    return a;
}

int main(int argc, char** argv) {
    int maxN = (argc > 1) ? atoi(argv[1]) : 2000;
    mt19937 rng(343);   // fixed seed -> reproducible, like Sedgewick's reference file

    printf("%6s %9s %14s %7s %9s %7s\n",
           "N", "triples", "operations", "ratio", "time(s)", "tratio");
    double prevOps = 0, prevTime = 0;
    for (int N = 250; N <= maxN; N += N) {
        vector<int> a = randomInts(N, rng);
        long long ops = 0;
        auto t0 = chrono::steady_clock::now();
        long triples = count3(a, ops);
        auto t1 = chrono::steady_clock::now();
        double secs = chrono::duration<double>(t1 - t0).count();

        double ratio  = prevOps  ? (double)ops / prevOps   : 0.0;
        double tratio = prevTime ? secs / prevTime          : 0.0;
        printf("%6d %9ld %14lld %7.2f %9.3f %7.2f\n",
               N, triples, ops, ratio, secs, tratio);
        prevOps = ops; prevTime = secs;
    }
    printf("\noperations ~ N^3/6 ; the ratio -> 8 = 2^3  =>  order of growth N^3\n");
    return 0;
}
