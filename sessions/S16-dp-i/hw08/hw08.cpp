// CSS 343 - Homework 8: divide and conquer; dynamic programming.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -O2 hw08.cpp -o hw08
//   run:         ./hw08
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the six TODOs. Each applies an idea from Lectures 15
// and 16 to a case the slides do not work out: read each contract carefully.
//
// Ranges are inclusive: a[lo..hi] is a[lo], a[lo+1], ..., a[hi]. Keys may
// repeat. Arrays can hold 1,000,000 keys.

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// ============================================================================
// Part A - divide and conquer (Lecture 15)
// ============================================================================

// ---- TODO 1: merge -------------------------------------------------------------
// Merge the adjacent sorted runs a[lo..mid] and a[mid+1..hi] into one sorted
// run a[lo..hi], as the lecture's merge does: copy a[lo..hi] into aux (aux is
// at least as long as a), then fill a[k] for k = lo..hi from the two fronts,
// taking the RIGHT front only when it is strictly smaller. A tie takes the
// left front, which is what makes mergesort stable.
// Also return the number of CROSS INVERSIONS: pairs (x, y) with x in the left
// run, y in the right run, and y < x. When the right front is taken while the
// left run still holds keys, it is smaller than every one of them: count them
// all in one step, never one pair at a time.
//   runs 2 5 8 | 1 3 9  ->  1 2 3 5 8 9, returns 5  (1 is below 2, 5, 8; 3 below 5, 8)
//   runs 4 4 | 4        ->  4 4 4,       returns 0  (equal keys are not inverted)
long long merge(vector<int>& a, int lo, int mid, int hi, vector<int>& aux) {
    // TODO 1
    return 0;
}

// ---- TODO 2: mergesortCount ----------------------------------------------------
// Sort a[lo..hi] by top-down mergesort (split at mid = lo + (hi - lo) / 2,
// sort each half, merge them with your merge) and return the number of
// INVERSIONS the range held before sorting: pairs of positions i < j with
// a[i] > a[j]. Every inversion lies inside the left half, inside the right
// half, or across the two, where the merge counts it. A range with hi <= lo
// has none. n keys can hold n(n-1)/2 inversions, about 5 * 10^11 for a
// million keys: count in long long. The work must be about n log n: our
// grading tests sort 1,000,000 keys.
//   38 27 43 3 9 82 10  ->  3 9 10 27 38 43 82, returns 11
long long mergesortCount(vector<int>& a, int lo, int hi, vector<int>& aux) {
    // TODO 2
    return 0;
}

// ---- TODO 3: partition ---------------------------------------------------------
// Lomuto's partition of a[lo..hi] around pivot = a[hi], exactly the lecture's
// scheme: one scan j from lo to hi-1 moves every key STRICTLY smaller than the
// pivot into a growing region at the front, then the pivot is swapped in just
// past that region. Return the pivot's final index. Keys outside a[lo..hi]
// are not touched. Our grading tests compare the whole rearranged array, not
// only the returned index, so the order of the swaps matters.
//   3 7 1 9 4 8 6 2 5  ->  3 1 4 2 5 8 6 9 7, returns 4
//   5 9 3 8 6 1        ->  1 9 3 8 6 5,       returns 0  (nothing is below 1)
int partition(vector<int>& a, int lo, int hi) {
    // TODO 3
    return lo;
}

// GIVEN: a uniformly random index in lo..hi. The generator has a fixed seed,
// so every run makes the same choices.
static unsigned long long rngState = 343;
int randomIndex(int lo, int hi) {
    rngState = rngState * 6364136223846793005ULL + 1442695040888963407ULL;
    return lo + (int)((rngState >> 33) % (unsigned long long)(hi - lo + 1));
}

// ---- TODO 4: quickselect -------------------------------------------------------
// Return the k-th smallest key of a (k = 0 is the minimum, k = a.size() - 1
// the maximum); a is rearranged along the way. Partition with your partition,
// then continue into ONLY the side that holds rank k. Choose every pivot at
// random: before each partition of a[lo..hi], swap a[randomIndex(lo, hi)]
// with a[hi]. With the fixed last-element pivot, sorted input costs about
// n^2 / 2 comparisons; with a random pivot the expected cost is linear on
// every input. Our grading tests select from sorted and reverse-sorted arrays
// of 1,000,000 distinct keys. (Many EQUAL keys still slow a Lomuto partition
// down; the large tests do not use them.)
//   7 2 9 4 1 6 3: k = 3 gives 4 (the median), k = 4 gives 6
int quickselect(vector<int>& a, int k) {
    // TODO 4
    return 0;
}

// ============================================================================
// Part B - dynamic programming (Lecture 16)
// ============================================================================

// GIVEN: rod cutting by plain recursion, with a call counter. It tries every
// first cut and remembers nothing, so best(len) is recomputed along every
// path: a rod of length n costs exactly 2^n calls.
static long long naiveCalls = 0;
int rodCutNaive(const vector<int>& price, int len) {
    naiveCalls++;
    if (len == 0) return 0;
    int best = -1;
    for (int i = 1; i <= len; i++)
        best = max(best, price[i] + rodCutNaive(price, len - i));
    return best;
}

// ---- TODO 5: rodCut ------------------------------------------------------------
// Rod cutting where every CUT costs c (c >= 0; c = 0 is the lecture's
// problem). price[i] >= 0 is the price of a piece of length i (price[0] = 0
// is unused). Cutting a rod into k pieces earns the sum of their prices minus
// (k - 1) * c. Return the best total for a rod of length n, and fill cut
// (resize it to n + 1) with cut[len] = the length of the first piece of a best
// cutting of a rod of length len (cut[0] = 0).
// Tabulate bottom-up, as the lecture does: best[0] = 0, and for len = 1..n try
// every first piece i = 1..len; keeping the whole rod (i = len) needs no cut,
// every other i costs one cut on top of best[len - i]. Ties keep the FIRST
// i that reaches the maximum (replace only on strictly greater). The work must
// be about n^2: our grading tests use n = 5,000.
//   prices 1 5 8 9, n = 4: c = 0 -> 10, cut = 0 1 2 3 2   (two pieces of 2)
//                          c = 1 -> 9,  cut[4] = 2        (2 + 2 ties the whole rod)
//                          c = 2 -> 9,  cut[4] = 4        (no cut pays)
int rodCut(const vector<int>& price, int n, int c, vector<int>& cut) {
    // TODO 5
    cut.assign(n + 1, 0);
    return 0;
}

// ---- TODO 6: lcsLength ---------------------------------------------------------
// The length of a longest common subsequence of A and B. Fill the lecture's
// table L, where L[i][j] is the LCS length of the first i characters of A and
// the first j characters of B; row 0 and column 0 are 0. Mind the shift: cell
// (i, j) compares A[i-1] with B[j-1]. The work must be about m * n: our
// grading tests use two strings of 3,000 characters.
//   AGCAT, GAC -> 2 (AC, GA and GC all have length 2)
int lcsLength(const string& A, const string& B) {
    // TODO 6
    return 0;
}

// ============================================================================
// GIVEN: the unit-test battery. Do not edit below this line.
// ============================================================================
#ifndef HW08_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}

int main() {
    cout << "T1 - merge\n";
    {
        vector<int> a = {2, 5, 8, 1, 3, 9}, aux(a.size());
        long long x = merge(a, 0, 2, 5, aux);
        check(a == vector<int>({1, 2, 3, 5, 8, 9}) && x == 5, "2 5 8 | 1 3 9: sorted, 5 cross inversions");
        vector<int> b = {4, 4, 4}, auxb(3);
        check(merge(b, 0, 1, 2, auxb) == 0 && b == vector<int>({4, 4, 4}), "4 4 | 4: equal keys are not inversions");
        vector<int> c = {9, 1, 4, 2, 3, 0}, auxc(6);                 // merge a[1..2] with a[3..4] only
        long long y = merge(c, 1, 2, 4, auxc);
        check(c == vector<int>({9, 1, 2, 3, 4, 0}) && y == 2, "9 [1 4 | 2 3] 0: only a[1..4] changes, 2 cross inversions");
    }

    cout << "T2 - mergesortCount\n";
    {
        vector<int> a = {38, 27, 43, 3, 9, 82, 10}, aux(a.size());
        long long x = mergesortCount(a, 0, 6, aux);
        check(a == vector<int>({3, 9, 10, 27, 38, 43, 82}) && x == 11, "38 27 43 3 9 82 10: sorted, 11 inversions");
        vector<int> r = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1}, auxr(10);
        long long y = mergesortCount(r, 0, 9, auxr);
        check(is_sorted(r.begin(), r.end()) && y == 45, "10 down to 1: every pair is inverted, 45");
        vector<int> e = {7, 7, 7, 7, 7}, s = {1, 2, 3, 4, 5}, auxe(5);
        check(mergesortCount(e, 0, 4, auxe) == 0 && mergesortCount(s, 0, 4, auxe) == 0, "all equal, and already sorted: 0 inversions");
    }

    cout << "T3 - partition\n";
    {
        vector<int> a = {3, 7, 1, 9, 4, 8, 6, 2, 5};
        int p = partition(a, 0, 8);
        check(p == 4 && a == vector<int>({3, 1, 4, 2, 5, 8, 6, 9, 7}), "3 7 1 9 4 8 6 2 5 -> 3 1 4 2 5 8 6 9 7, pivot 5 at index 4");
        vector<int> b = {5, 9, 3, 8, 6, 1};
        int q = partition(b, 0, 5);
        check(q == 0 && b == vector<int>({1, 9, 3, 8, 6, 5}), "smallest pivot: 5 9 3 8 6 1 -> 1 9 3 8 6 5, index 0");
        vector<int> c = {9, 4, 6, 2, 5, 0};                          // partition a[1..4] only
        int r = partition(c, 1, 4);
        check(r == 3 && c == vector<int>({9, 4, 2, 5, 6, 0}), "9 [4 6 2 5] 0 -> 9 4 2 5 6 0: keys outside a[1..4] stay");
        vector<int> e = {4, 2, 4, 1, 4};
        int s = partition(e, 0, 4);
        check(s == 2 && e == vector<int>({2, 1, 4, 4, 4}), "4 2 4 1 4 -> 2 1 4 4 4, index 2: keys EQUAL to the pivot stay on its right");
    }

    cout << "T4 - quickselect\n";
    {
        vector<int> a = {7, 2, 9, 4, 1, 6, 3}, b = a;
        check(quickselect(a, 3) == 4 && quickselect(b, 4) == 6, "7 2 9 4 1 6 3: rank 3 is 4, rank 4 is 6");
        vector<int> base = {5, 1, 5, 3, 8, 1, 9, 5, 2}, sorted = base;
        sort(sorted.begin(), sorted.end());
        bool ok = true;
        for (int k = 0; k < 9; k++) { vector<int> v = base; if (quickselect(v, k) != sorted[k]) ok = false; }
        check(ok, "every rank of 5 1 5 3 8 1 9 5 2 (repeated keys)");
    }

    cout << "T5 - rodCut\n";
    {
        vector<int> price = {0, 1, 5, 8, 9}, cut;
        int v0 = rodCut(price, 4, 0, cut);
        check(v0 == 10 && cut == vector<int>({0, 1, 2, 3, 2}), "prices 1 5 8 9, no cut cost: 10, cut = 0 1 2 3 2");
        int v1 = rodCut(price, 4, 1, cut);
        bool c1 = v1 == 9 && cut.size() == 5 && cut[4] == 2;
        int v2 = rodCut(price, 4, 2, cut);
        check(c1 && v2 == 9 && cut.size() == 5 && cut[4] == 4, "cut cost 1: 9 with cut[4] = 2 (first of a tie); cost 2: 9 with cut[4] = 4");
        vector<int> p12 = {0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30, 31, 33};
        naiveCalls = 0;
        int naive = rodCutNaive(p12, 12);
        check(naiveCalls == 4096 && rodCut(p12, 12, 0, cut) == naive, "n = 12: the plain recursion makes 4,096 calls; the table agrees with it");
    }

    cout << "T6 - lcsLength\n";
    {
        check(lcsLength("AGCAT", "GAC") == 2, "AGCAT and GAC: 2");
        check(lcsLength("SUNDAY", "SATURDAY") == 5 && lcsLength("SATURDAY", "SUNDAY") == 5, "SUNDAY and SATURDAY, either order: 5 (SUDAY)");
        check(lcsLength("", "ABC") == 0 && lcsLength("ABCBDAB", "ABCBDAB") == 7, "an empty string: 0; a string with itself: its length");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
