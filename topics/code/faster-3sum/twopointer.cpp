// CSS 343 · topic program: 3-sum in N^2 with two pointers
//
// The whole order-of-growth ladder for 3-sum, side by side:
//   ThreeSum            brute force, every triple           ~ N^3
//   ThreeSumFast        sort + binary search per pair       ~ N^2 log N
//   ThreeSumTwoPointer  sort + two-pointer scan per i       ~ N^2
//   ThreeSumSignSplit   split by sign, pair pos*neg, search ~ N^2 log N
//   ThreeSumSignSplitHash  ... same, but O(1) hash membership   ~ N^2
//
// faster.cpp stopped at N^2 log N. Two pointers drop the log: after sorting,
// fix a[i] and solve the 2-sum on the sorted tail with two pointers converging
// from the ends (a linear scan), so the whole algorithm is N^2, the order
// 3-sum is believed (but not proven) unable to beat.
//
// Each algorithm prints the TRIPLES it found (they must agree) and its work:
// operation count, wall-clock time, and the doubling MULTIPLIER for each (the
// factor vs the previous N). The op multiplier and the time multiplier should
// agree: the model predicts the stopwatch. Each version is capped where it gets
// too slow: N^3 up to N3_MAX, the N^2 log N versions up to N2LOGN_MAX; the two
// N^2 versions run all the way to MAX_SIZE.
//
// Build & run:  g++ -std=c++17 -O2 twopointer.cpp -o twopointer
//
//   ./twopointer          # full ladder, N = 1000 .. 128000 (~3 min)
//   ./twopointer 16000    # class-sized run (~20 s, mostly the cubic rung)

#include <cstdio>
#include <cstdlib>
#include <vector>
#include <algorithm>
#include <random>
#include <unordered_set>
#include <chrono>
using namespace std;

const int N3_MAX       = 4000;   // cap for the N^3 brute force
const int N2LOGN_MAX   = 16000;  // cap for ThreeSumFast (N^2 log N, no pruning)
const int N2LOGN_MAX_B = 64000;  // cap for ThreeSumSignSplit (N^2 log N, but prunes -> runs further)
const int MAX_SIZE     = 128000; // cap for the two N^2 versions

long long ops;   // counted "array accesses" (the cost model, same as faster.cpp)

// ---- binary search (for the N^2 log N version) ----------------------------
int rankOf(int key, const vector<int>& a, int lo = 0, int hi = -1) {
    if (hi == -1) hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        ops++;                                  // one array access per compare
        if      (key < a[mid]) hi = mid - 1;
        else if (key > a[mid]) lo = mid + 1;
        else return mid;
    }
    return -1;
}

// ---- the three algorithms -------------------------------------------------
long threeSum(const vector<int>& a, int N) {    // ~N^3  (reads a[0..N-1])
    long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            for (int k = j + 1; k < N; k++) {
                ops += 3;
                if (a[i] + a[j] + a[k] == 0) cnt++;
            }
    return cnt;
}

long threeSumFast(const vector<int>& src, int N) {   // ~N^2 log N
    vector<int> a(src.begin(), src.begin() + N);     // own sorted copy of the first N
    sort(a.begin(), a.end());
    long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++) {
            ops += 2;
            if (rankOf(-a[i] - a[j], a) > j) cnt++;
        }
    return cnt;
}

long threeSumTwoPointer(const vector<int>& src, int N) {   // ~N^2
    vector<int> a(src.begin(), src.begin() + N);           // own sorted copy of the first N
    sort(a.begin(), a.end());                   // N log N preprocess (not counted)
    long cnt = 0;
    for (int i = 0; i < N; i++) {               // fix a[i] ...
        int lo = i + 1, hi = N - 1;             // ... two pointers on the sorted tail
        while (lo < hi) {
            ops += 2;                           // read a[lo], a[hi]
            int s = a[i] + a[lo] + a[hi];
            if      (s < 0) lo++;               // too small -> raise the low end
            else if (s > 0) hi--;               // too big   -> lower the high end
            else { cnt++; lo++; hi--; }         // hit zero  -> count, move both
        }
    }
    return cnt;
    // NOTE: the count/move line assumes DISTINCT values (as do faster.cpp's fast
    // versions). With duplicates, a zero-sum hit covers a block of equal values:
    // count the equal-value run on each side (cl, ch) and add cl*ch instead of 1.
}

long threeSumTwoPointerB(const vector<int>& src, int N) {   // ~N^2
    vector<int> a(src.begin(), src.begin() + N);           // own sorted copy of the first N
    sort(a.begin(), a.end());                   // N log N preprocess (not counted)
    long cnt = 0;
    for (int i = 0; i < N; i++) {               // fix a[i] ...
        if (a[i] >= 0) break;                   // no more triples with a[i] positive
        int lo = i + 1, hi = N - 1;             // ... two pointers on the sorted tail
        while (lo < hi) {
            ops += 2;                           // read a[lo], a[hi]
            int s = a[i] + a[lo] + a[hi];
            if      (s < 0) lo++;               // too small -> raise the low end
            else if (s > 0) hi--;               // too big   -> lower the high end
            else { cnt++; lo++; hi--; }         // hit zero  -> count, move both
        }
    }
    return cnt;
    // NOTE: the count/move line assumes DISTINCT values (as do faster.cpp's fast
    // versions). With duplicates, a zero-sum hit covers a block of equal values:
    // count the equal-value run on each side (cl, ch) and add cl*ch instead of 1.
}

// Sign-split: a zero-sum triple has >=1 positive and >=1 negative. Pick a positive
// p[i] and a negative n[j]; the third is determined: -(p[i]+n[j]). Binary-search
// for it, counting each triple ONCE. The dedup is FREE: searching only ABOVE the
// current index finds the third exactly when it is the larger partner, so each
// triple is tallied at its smaller positive / smaller-magnitude negative.
// ~N^2 log N (a binary search per pair); the outer break prunes on random data.
// (0 is filed with the positives, so {0, v, -v} is found via the (0, -v) pair.)
long threeSumSignSplit(const vector<int>& a, int N) {   // ~N^2 log N
    vector<int> pos, negAbs;                    // pos ascending; |neg| ascending
    for (int k = 0; k < N; k++) {
        int x = a[k];
        if      (x >= 0) pos.push_back(x);
        else if (x < 0)  negAbs.push_back(-x);
    }
    sort(pos.begin(), pos.end());
    sort(negAbs.begin(), negAbs.end());
    int Np = (int)pos.size(), Nn = (int)negAbs.size();
    long cnt = 0;
    if (Np == 0 || Nn == 0) return cnt;         // need both signs (distinct => no all-zero triple)
    long long maxNegAbs = negAbs[Nn - 1];
    long long secondAbs = (Nn >= 2) ? negAbs[Nn - 2] : 0;
    for (int i = 0; i < Np; i++) {
        if ((long long)pos[i] > maxNegAbs + secondAbs) break;   // p[i] too big for ANY triple
        // Moving search bounds, reset per i. As j grows:
        //   neg branch: the wanted magnitude SHRINKS, so its index in negAbs only
        //               moves DOWN  -> carry a moving upper bound (hiNeg).
        //   pos branch: the wanted value GROWS, so its index in pos only moves
        //               UP          -> carry a moving lower bound (loPos).
        // Tighten only on a HIT (a miss returns -1, which is not a valid bound).
        int hiNeg = Nn - 1;
        int loPos = i + 1;
        for (int j = 0; j < Nn; j++) {
            ops++;                              // one pair examined
            if (pos[i] >= negAbs[j]) {
                // sum >= 0 -> third is negative; magnitude pos[i]-negAbs[j].
                // search negAbs in [j+1, hiNeg]: a hit dedups (index > j) and tightens hi
                int thirdAbs = pos[i] - negAbs[j];
                int r = rankOf(thirdAbs, negAbs, j + 1, hiNeg);
                if (r != -1) { cnt++; hiNeg = r; }
            } else {
                // sum < 0 -> third is positive; value negAbs[j]-pos[i].
                // search pos in [loPos, Np-1]: a hit dedups (index > i) and raises lo
                int thirdAbs = negAbs[j] - pos[i];
                int r = rankOf(thirdAbs, pos, loPos, Np - 1);
                if (r != -1) { cnt++; loPos = r; }
            }
        }
    }
    return cnt;
    // Assumes DISTINCT values, like the other fast versions.
}

// Same sign-split, but membership via an O(1) hash probe instead of binary search,
// so it is true ~N^2 (no log factor). Without the "search above the index" trick
// the dedup is stated explicitly: count a 2-negative triple only at its smaller
// magnitude (thirdAbs > negAbs[j]), a 2-positive triple only at its smaller
// positive (thirdAbs > pos[i]).
long threeSumSignSplitHash(const vector<int>& a, int N) {   // ~N^2 (O(1) hash membership)
    vector<int> pos, negAbs;                    // pos ascending; |neg| ascending
    for (int k = 0; k < N; k++) {
        int x = a[k];
        if      (x >= 0) pos.push_back(x);
        else if (x < 0)  negAbs.push_back(-x);
    }
    sort(pos.begin(), pos.end());               // only for the outer break's monotonicity
    sort(negAbs.begin(), negAbs.end());
    unordered_set<int> posSet(pos.begin(), pos.end());      // positive values (incl. 0)
    unordered_set<int> negSet(negAbs.begin(), negAbs.end()); // negative magnitudes
    int Np = (int)pos.size(), Nn = (int)negAbs.size();
    long cnt = 0;
    if (Np == 0 || Nn == 0) return cnt;
    long long maxNegAbs = negAbs[Nn - 1];
    long long secondAbs = (Nn >= 2) ? negAbs[Nn - 2] : 0;
    for (int i = 0; i < Np; i++) {
        if ((long long)pos[i] > maxNegAbs + secondAbs) break;   // p[i] too big for ANY triple
        for (int j = 0; j < Nn; j++) {
            ops++;                              // one pair examined + one O(1) hash probe
            if (pos[i] >= negAbs[j]) {
                int thirdAbs = pos[i] - negAbs[j];          // negative third, magnitude thirdAbs
                if (thirdAbs > negAbs[j] && negSet.count(thirdAbs)) cnt++;
            } else {
                int thirdAbs = negAbs[j] - pos[i];          // positive third, value thirdAbs
                if (thirdAbs > pos[i] && posSet.count(thirdAbs)) cnt++;
            }
        }
    }
    return cnt;
    // Assumes DISTINCT values, like the other fast versions.
}

// distinct random values, so all five algorithms count the same triples
vector<int> distinctValues(int N, mt19937& rng) {
    uniform_int_distribution<int> dist(-1000000, 1000000);
    unordered_set<int> seen; seen.reserve(2 * N);
    vector<int> a; a.reserve(N);
    while ((int)a.size() < N) { int x = dist(rng); if (seen.insert(x).second) a.push_back(x); }
    return a;
}

// format a doubling multiplier ("x4.00") vs the previous N, or "x   -" for the first
const char* mult(double now, double prev, char* buf) {
    if (prev > 0) snprintf(buf, 12, "x%.2f", now / prev);
    else          snprintf(buf, 12, "x   -");
    return buf;
}

// print one algorithm's line: triples found, then ops and time, each with its multiplier
void report(const char* name, const char* order, long triples,
            long long ops_now, long long ops_prev,
            double sec_now, double sec_prev) {
    char ro[12], rt[12];
    printf("  %-22s %-9s triples=%-6ld  ops=%-13lld %-6s  time=%9.4fs %-6s\n",
           name, order, triples,
           ops_now, mult((double)ops_now, (double)ops_prev, ro),
           sec_now, mult(sec_now, sec_prev, rt));
}

int main(int argc, char** argv) {
    int maxSize = (argc > 1) ? atoi(argv[1]) : MAX_SIZE;   // cap the whole run (class-sized: 16000)
    if (maxSize > MAX_SIZE) maxSize = MAX_SIZE;
    mt19937 rng(343);
    printf("3-sum: every algorithm finds the SAME triples; the work tells them apart.\n");

    long long pB = 0, pF = 0, pT = 0, pU = 0, pS = 0, pH = 0;   // previous op counts, per algorithm
    double pBt = 0, pFt = 0, pTt = 0, pUt = 0, pSt = 0, pHt = 0; // previous wall-clock times, per algorithm
    vector<int> a = distinctValues(MAX_SIZE, rng);              // full pool either way, so counts match across runs
    for (int N = 1000; N <= maxSize; N += N) {
        long bTri = -1, fTri = -1, tTri = -1, uTri = -1, sTri = -1, hTri = -1;
        long long bOps = 0, fOps = 0, tOps = 0, uOps = 0, sOps = 0, hOps = 0;
        double bSec = 0, fSec = 0, tSec = 0, uSec = 0, sSec = 0, hSec = 0;

        printf("\nN = %d\n", N);

        if (N <= N3_MAX) {
            ops = 0;
            auto t0 = chrono::steady_clock::now();
            bTri = threeSum(a, N);
            bSec = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
            bOps = ops;
            report("ThreeSum", "N^3", bTri, bOps, pB, bSec, pBt);
        } else {
            printf("  %-22s %-9s triples=  -    (skipped: N^3 too slow above N=%d)\n",
                    "ThreeSum", "N^3", N3_MAX);
        }
        if (N <= N2LOGN_MAX) {
            ops = 0;
            auto t1 = chrono::steady_clock::now();
            fTri = threeSumFast(a, N);
            fSec = chrono::duration<double>(chrono::steady_clock::now() - t1).count();
            fOps = ops;
            report("ThreeSumFast",       "N^2 lgN",   fTri, fOps, pF, fSec, pFt);
        } else {
            printf("  %-22s %-9s triples=  -    (skipped: N^2 lgN too slow above N=%d)\n",
                    "ThreeSumFast", "N^2 lgN", N2LOGN_MAX);
        }

        if (N <= N2LOGN_MAX_B) {
            ops = 0;
            auto t3 = chrono::steady_clock::now();
            sTri = threeSumSignSplit(a, N);
            sSec = chrono::duration<double>(chrono::steady_clock::now() - t3).count();
            sOps = ops;
            report("ThreeSumSignSplit",  "N^2 lgN",   sTri, sOps, pS, sSec, pSt);
        } else {
            printf("  %-22s %-9s triples=  -    (skipped: N^2 lgN too slow above N=%d)\n",
                    "ThreeSumSignSplit", "N^2 lgN", N2LOGN_MAX_B);
        }

        ops = 0;
        auto t2 = chrono::steady_clock::now();
        tTri = threeSumTwoPointer(a, N);
        tSec = chrono::duration<double>(chrono::steady_clock::now() - t2).count();
        tOps = ops;
        report("ThreeSumTwoPointer", "N^2",       tTri, tOps, pT, tSec, pTt);

        ops = 0;
        auto t5 = chrono::steady_clock::now();
        uTri = threeSumTwoPointerB(a, N);
        uSec = chrono::duration<double>(chrono::steady_clock::now() - t5).count();
        uOps = ops;
        report("ThreeSumTwoPointerB", "N^2",       uTri, uOps, pU, uSec, pUt);

        ops = 0;
        auto t4 = chrono::steady_clock::now();
        hTri = threeSumSignSplitHash(a, N);
        hSec = chrono::duration<double>(chrono::steady_clock::now() - t4).count();
        hOps = ops;
        report("ThreeSumSignSplitHash", "N^2",    hTri, hOps, pH, hSec, pHt);

        // only the algorithms that actually ran at this N may be compared; the two
        // O(N^2) versions always run, so they are the baseline the rest must match
        bool ok = (tTri == hTri && uTri == tTri);
        if (N <= N2LOGN_MAX)   ok = ok && fTri == tTri;
        if (N <= N2LOGN_MAX_B) ok = ok && sTri == tTri;
        if (N <= N3_MAX)       ok = ok && bTri == tTri;
        if (!ok) {
            printf("  MISMATCH! the algorithms disagree on the count\n");
            return 1;
        }
        if (N <= N3_MAX)       { pB = bOps; pBt = bSec; }
        if (N <= N2LOGN_MAX)   { pF = fOps; pFt = fSec; }
        if (N <= N2LOGN_MAX_B) { pS = sOps; pSt = sSec; }
        pT = tOps; pTt = tSec;
        pU = uOps; pUt = uSec;
        pH = hOps; pHt = hSec;
    }
    printf("\nMultipliers per doubling:  N^3 -> 8,  N^2 log N -> a hair above 4,  N^2 -> 4.\n"
           "Binary-search membership costs a log; an O(1) hash probe removes it. Every\n"
           "correct method here is quadratic; none is known to beat N^2 for 3-sum.\n");
    return 0;
}
