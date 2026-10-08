// CSS 343 - Homework 2: analysis of algorithms, time and memory.
// Fill in the TODOs, then run the program.
//
//   build:   g++ -std=c++17 -O2 hw02.cpp -o hw02
//   run:     ./hw02
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the TODOs. Each one applies a tool from Lectures 2
// and 3 to a case the slides do not work out: read its contract carefully.
// Run early and often: the tests report [PASS]/[FAIL] one by one.

#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
using namespace std;

// ============================================================================
// Part A - The doubling experiment, generalized (Lecture 2)
// ============================================================================

// ---- TODO 1: estimateExponent -----------------------------------------------
// ns[i] is an input size and counts[i] the operations measured at that size;
// ns is strictly increasing and has at least two entries. The sizes need NOT
// double: they may grow by any factor, and not always by the same one.
//
// Assume the cost is a power law, count = a * n^b. Return the exponent b
// estimated from the LAST TWO measurements only (lower-order terms fade as n
// grows, so the last pair is the most accurate).
double estimateExponent(const vector<long long>& ns, const vector<long long>& counts) {
    // TODO 1
    return 0;
}

// ---- TODO 2: predictCount ---------------------------------------------------
// Same inputs, plus a target size larger than ns.back(). Using the exponent b
// from estimateExponent, extrapolate from the LAST measurement: return the
// count a power law with that exponent predicts at the target size.
double predictCount(const vector<long long>& ns, const vector<long long>& counts, long long target) {
    // TODO 2
    return 0;
}

// ============================================================================
// Part B - Design with a sort (Lecture 2)
// ============================================================================

// ---- TODO 3: countPairsWithDifference ---------------------------------------
// The values in a are DISTINCT (in no particular order), and d >= 1. Return
// the number of pairs of values (x, y) in a with y - x == d.
//
// It must run in time proportional to N log2 N or better: the tests include an
// array of 400,000 values and stop any version that takes longer than a few
// seconds, which rules out checking every pair. You may use std::sort.
long countPairsWithDifference(vector<int> a, int d) {
    // TODO 3
    return 0;
}

// ============================================================================
// Part C - Witnesses for asymptotic notation (Lecture 3)
// ============================================================================
// A claim f in O(g) is proved by constants c > 0 and n0 >= 1 with
// f(n) <= c * g(n) for EVERY n >= n0 (and f in Omega(g) by c * g(n) <= f(n)).
// Return constants that prove each claim. Any valid constants earn full
// credit; they need not be the smallest. Limits: every constant is at most
// 1,000,000. log2 is the logarithm base 2 (some books write lg).

struct Witness      { double c;       long n0; };   // GIVEN
struct ThetaWitness { double c1, c2;  long n0; };   // GIVEN

// ---- TODO 4: witnesses --------------------------------------------------------
// (a)  7n^2 + 20n + 100  is in  O(n^2)
Witness witnessA() {
    // TODO 4a
    return {0, 0};
}
// (b)  3n^2 - 100n  is in  Omega(n^2)
Witness witnessB() {
    // TODO 4b
    return {0, 0};
}
// (c)  n log2 n + 5n  is in  Theta(n log2 n):  c1 * n log2 n <= n log2 n + 5n <= c2 * n log2 n
ThetaWitness witnessC() {
    // TODO 4c
    return {0, 0, 0};
}

// ============================================================================
// Part D - Counting bytes (Lecture 3)
// ============================================================================

// GIVEN: a record as someone first wrote it.
struct Record {
    char   tag;
    double value;
    char   flag;
    int    id;
    short  kind;
};

// ---- TODO 5: RecordPacked -----------------------------------------------------
// The same five members (same names, same types), reordered so that
// sizeof(RecordPacked) == 16 on a 64-bit machine. Do not add or remove
// members, and do not use compiler-specific packing directives.
struct RecordPacked {
    // TODO 5: reorder these members
    char   tag;
    double value;
    char   flag;
    int    id;
    short  kind;
};

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW02_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}
static bool near(double x, double want, double tol) { return fabs(x - want) <= tol; }

int main() {
    cout << "T1 - estimateExponent\n";
    {
        // brute-force 3-sum, triples tested (Lecture 2's experiment)
        vector<long long> ns = {250, 500, 1000, 2000};
        vector<long long> cs = {2573000, 20708500, 166167000, 1331334000};
        check(near(estimateExponent(ns, cs), 3.0, 0.01), "3-sum's counts give an exponent within 0.01 of 3");
        // sort + binary search 2-sum, array accesses
        vector<long long> n2 = {1000, 2000, 4000};
        vector<long long> c2 = {10979, 23937, 51912};
        double b = estimateExponent(n2, c2);
        check(b > 1.05 && b < 1.2, "fast 2-sum's counts give a little over 1 (N log2 N)");
        // sizes that triple: 5 n^2 exactly
        vector<long long> n3 = {100, 300, 900};
        vector<long long> c3 = {50000, 450000, 4050000};
        check(near(estimateExponent(n3, c3), 2.0, 1e-9), "sizes tripling, 5n^2: exactly 2");
        // the first pair would say 1, the last pair says 2
        vector<long long> n4 = {10, 20, 40};
        vector<long long> c4 = {100, 200, 800};
        check(near(estimateExponent(n4, c4), 2.0, 1e-9), "uses the last two measurements");
    }

    cout << "T2 - predictCount\n";
    {
        vector<long long> ns = {250, 500, 1000, 2000};
        vector<long long> cs = {2573000, 20708500, 166167000, 1331334000};
        double p = predictCount(ns, cs, 4000);
        check(fabs(p - 10658668000.0) / 10658668000.0 < 0.001, "3-sum at N = 4000: within 0.1% of C(4000,3) = 10,658,668,000");
        vector<long long> n3 = {100, 300, 900};
        vector<long long> c3 = {50000, 450000, 4050000};
        check(near(predictCount(n3, c3, 1800), 16200000.0, 1e-3), "5n^2 at n = 1800: 16,200,000");
    }

    cout << "T3 - countPairsWithDifference\n";
    {
        check(countPairsWithDifference({1, 5, 3, 4, 2}, 2) == 3, "{1,5,3,4,2}, d = 2: (1,3) (2,4) (3,5)");
        check(countPairsWithDifference({8, 12, 16, 4, 0, 20}, 4) == 5, "multiples of 4, d = 4: 5 pairs");
        check(countPairsWithDifference({-7, 3, 13, 10, -4}, 10) == 2, "{-7,3,13,10,-4}, d = 10: (-7,3) (3,13)");
        check(countPairsWithDifference({1, 2, 3}, 5) == 0 && countPairsWithDifference({42}, 1) == 0, "no pair: d too large; one element");
        vector<int> big;
        for (int i = 0; i < 200000; i++) big.push_back((i * 7919) % 200000);   // 0..199999, shuffled
        check(countPairsWithDifference(big, 1000) == 199000, "0..199999 shuffled, d = 1000: 199,000 pairs (runs fast only if N log2 N)");
    }

    cout << "T4 - witnesses (checked for every n from n0 to 1,000,000)\n";
    {
        auto okUpper = [](Witness w, auto f, auto g) {
            if (!(w.c > 0 && w.c <= 1e6 && w.n0 >= 1 && w.n0 <= 1000000)) return false;
            for (long n = w.n0; n <= 1000000; n++) if (f((double)n) > w.c * g((double)n)) return false;
            return true;
        };
        auto okLower = [](Witness w, auto f, auto g) {
            if (!(w.c > 0 && w.c <= 1e6 && w.n0 >= 1 && w.n0 <= 1000000)) return false;
            for (long n = w.n0; n <= 1000000; n++) if (w.c * g((double)n) > f((double)n)) return false;
            return true;
        };
        auto sq = [](double n) { return n * n; };
        check(okUpper(witnessA(), [](double n) { return 7 * n * n + 20 * n + 100; }, sq), "(a) 7n^2 + 20n + 100 in O(n^2)");
        check(okLower(witnessB(), [](double n) { return 3 * n * n - 100 * n; }, sq), "(b) 3n^2 - 100n in Omega(n^2)");
        ThetaWitness t = witnessC();
        auto f = [](double n) { return n * log2(n) + 5 * n; };
        auto g = [](double n) { return n * log2(n); };
        check(okLower({t.c1, t.n0}, f, g) && okUpper({t.c2, t.n0}, f, g), "(c) n log2 n + 5n in Theta(n log2 n)");
    }

    cout << "T5 - RecordPacked\n";
    {
        cout << "  sizeof(Record) = " << sizeof(Record) << ", sizeof(RecordPacked) = " << sizeof(RecordPacked) << "\n";
        check(sizeof(RecordPacked) == 16, "sizeof(RecordPacked) == 16");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
