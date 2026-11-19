// CSS 343 - topic program: Fibonacci four ways, the arc from an exponential
// recursion to a two-variable loop. The functions are exactly as on the slides
// (and in the Dynamic Programming Method chapter); the call counts come from
// counted copies, which main checks against the plain ones.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 fib.cpp -o fib
//   run:    ./fib
#include <iostream>
#include <vector>
using namespace std;

// Naive Fibonacci, straight from the definition: correct, but every call
// solves its subproblems from scratch. 2 fib(n+1) - 1 calls, Theta(phi^n).
long fibNaive(int n) {
    if (n < 2) return n;                  // base cases: fib(0)=0, fib(1)=1
    return fibNaive(n - 1) + fibNaive(n - 2);   // both solved again, every time
}

// Memoized Fibonacci: the natural recursion plus a cache. Each fib(k) is
// computed once; every later request is an O(1) hit. Theta(n) time and space.
long fibMemo(int n, vector<long>& memo) {
    if (n < 2) return n;                  // base cases: fib(0)=0, fib(1)=1
    if (memo[n] != 0) return memo[n];     // remember: cache hit, subtree skipped
    memo[n] = fibMemo(n - 1, memo)        // computed at most once per n ...
            + fibMemo(n - 2, memo);
    return memo[n];                       // ... then stored for every caller
}

// Tabulated Fibonacci: fill fib(0..n) smallest-first -- every dependency is
// already in the table when a cell needs it. Theta(n) time, Theta(n) space.
long fibTab(int n) {
    vector<long> t(n + 2);
    t[0] = 0; t[1] = 1;                   // base cases seed the table
    for (int i = 2; i <= n; i++)
        t[i] = t[i - 1] + t[i - 2];       // dependencies already filled
    return t[n];
}

// Two variables: each value needs only the previous TWO, so keep just those.
// Theta(n) time, Theta(1) space -- the optimization tabulation makes natural.
long fibTwoVar(int n) {
    long a = 0, b = 1;                    // invariant: a = fib(i), b = fib(i+1)
    for (int i = 0; i < n; i++) {
        long c = a + b;                   // one addition per step
        a = b; b = c;                     // slide the two-cell window right
    }
    return a;                             // after n steps, a = fib(n)
}

// ---- counted copies --------------------------------------------------------
long calls = 0, hits = 0;
long naiveCounted(int n) { calls++; if (n < 2) return n; return naiveCounted(n - 1) + naiveCounted(n - 2); }
long memoCounted(int n, vector<long>& memo) {
    calls++;
    if (n < 2) return n;
    if (memo[n] != 0) { hits++; return memo[n]; }
    memo[n] = memoCounted(n - 1, memo) + memoCounted(n - 2, memo);
    return memo[n];
}

int main() {
    for (int n : {5, 10, 20, 30}) {
        calls = 0; long v = naiveCounted(n);
        long naiveCalls = calls;
        vector<long> memo(n + 1, 0); calls = 0; hits = 0; memoCounted(n, memo);
        vector<long> memo2(n + 1, 0);
        bool agree = v == fibNaive(n) && v == fibMemo(n, memo2) && v == fibTab(n) && v == fibTwoVar(n);
        cout << "fib(" << n << ") = " << v << ": naive " << naiveCalls << " calls (2 fib(n+1) - 1 = "
             << 2 * fibTwoVar(n + 1) - 1 << "), memoized " << calls << " calls with " << hits << " hits, "
             << n << " additions in the loop" << (agree ? "" : "  MISMATCH") << "\n";
    }
    cout << "fib(50) = " << fibTwoVar(50) << "; naive calls would be " << 2 * fibTwoVar(51) - 1 << "\n";
    return 0;
}
