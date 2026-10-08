// CSS 343 - program: what the optimizer does to a timing experiment.
//
// countTriples is brute-force 3-sum. Build it twice and compare:
//   g++ -std=c++17 -O0 optimize.cpp -o opt0 && ./opt0
//   g++ -std=c++17 -O2 optimize.cpp -o opt2 && ./opt2
// The count of triples tested is the same; the time is not.
//
// Then the same loop runs twice, once printing its result and once throwing
// it away. At -O2 the compiler may delete a loop whose result is never used,
// so the second one "runs" in no time: a timing experiment must use its result.

#include <cstdio>
#include <vector>
#include <chrono>
using namespace std;

static unsigned rngState = 343;
static int rnd() { rngState = rngState * 1664525u + 1013904223u; return (int)(rngState >> 16) % 2001 - 1000; }

long countTriples(const vector<int>& a, long& tested) {
    long cnt = 0; int n = a.size();
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++) { tested++; if (a[i] + a[j] + a[k] == 0) cnt++; }
    return cnt;
}

int main() {
    vector<int> a(1500);
    for (int& x : a) x = rnd();
    long tested = 0;
    auto t0 = chrono::steady_clock::now();
    long c = countTriples(a, tested);
    double t = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    printf("3-sum, n = 1500: %ld triples tested, %ld found, %.3f s\n", tested, c, t);

    // the same billion-iteration loop twice: once keeping its result, once not
    t0 = chrono::steady_clock::now();
    long s = 0;
    for (long i = 0; i < 1000000000L; i++) s += i % 3;
    t = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    printf("a billion iterations, result printed: %.3f s   (sum %ld)\n", t, s);

    t0 = chrono::steady_clock::now();
    {
        [[maybe_unused]] long unused = 0;
        for (long i = 0; i < 1000000000L; i++) unused += i % 3;
    }                                                  // unused is never read
    t = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    printf("a billion iterations, result unused:  %.3f s\n", t);
}
