// CSS 343 · topic program: designing a faster algorithm
//
// Five algorithms for the same family of problems, with their operation counts,
// so the order-of-growth differences are visible:
//   TwoSum        brute force   ~ N^2
//   TwoSumFast    sort + binary search   ~ N log N
//   ThreeSum      brute force   ~ N^3
//   ThreeSumFast  sort + binary search   ~ N^2 log N
//   ThreeSum2Ptr  sort + two pointers    ~ N^2
// Counts are array accesses. The input values are distinct.
//
// Build & run:  g++ -std=c++17 -O2 faster.cpp -o faster && ./faster

#include <cstdio>
#include <cstdlib>
#include <vector>
#include <algorithm>
#include <random>
#include <unordered_set>
using namespace std;

long long ops;   // counted "array accesses" (the cost model)

// binary search for key in sorted a[]; returns an index of key, or -1.
int rankOf(int key, const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        ops++;                                  // one array access per compare
        if      (key < a[mid]) hi = mid - 1;
        else if (key > a[mid]) lo = mid + 1;
        else return mid;
    }
    return -1;
}

long twoSum(const vector<int>& a) {             // ~N^2
    int N = (int)a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++) {
            ops += 2;
            if (a[i] + a[j] == 0) cnt++;
        }
    return cnt;
}

long twoSumFast(vector<int> a) {                // ~N log N
    sort(a.begin(), a.end());
    int N = (int)a.size(); long cnt = 0;
    for (int i = 0; i < N; i++) { ops++; if (rankOf(-a[i], a) > i) cnt++; }
    return cnt;
}

long threeSum(const vector<int>& a) {           // ~N^3
    int N = (int)a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++)
            for (int k = j + 1; k < N; k++) {
                ops += 3;
                if (a[i] + a[j] + a[k] == 0) cnt++;
            }
    return cnt;
}

long threeSumFast(vector<int> a) {              // ~N^2 log N
    sort(a.begin(), a.end());
    int N = (int)a.size(); long cnt = 0;
    for (int i = 0; i < N; i++)
        for (int j = i + 1; j < N; j++) {
            ops += 2;
            if (rankOf(-a[i] - a[j], a) > j) cnt++;
        }
    return cnt;
}

long threeSumTwoPointer(vector<int> a) {        // ~N^2
    sort(a.begin(), a.end());                   // N log N preprocess (not counted)
    int N = (int)a.size(); long cnt = 0;
    for (int i = 0; i < N; i++) {               // fix a[i], then two pointers on the sorted tail
        int lo = i + 1, hi = N - 1;
        while (lo < hi) {
            ops += 2;                           // read a[lo], a[hi]
            int s = a[i] + a[lo] + a[hi];
            if      (s < 0) lo++;
            else if (s > 0) hi--;
            else { cnt++; lo++; hi--; }         // distinct values: move both
        }
    }
    return cnt;
}

int main() {
    mt19937 rng(343);
    uniform_int_distribution<int> dist(-1000000, 1000000);
    printf("%6s %14s %14s %16s %16s %16s\n",
           "N", "TwoSum N^2", "TwoSumFast NlgN", "ThreeSum N^3", "ThreeSumFast N^2lgN", "ThreeSum2Ptr N^2");
    for (int N = 1000; N <= 4000; N += N) {
        vector<int> a; a.reserve(N);              // DISTINCT values: the fast versions assume them
        unordered_set<int> seen;
        while ((int)a.size() < N) { int x = dist(rng); if (seen.insert(x).second) a.push_back(x); }
        long long c[5];
        ops = 0; twoSum(a);        c[0] = ops;
        ops = 0; twoSumFast(a);    c[1] = ops;
        ops = 0; long tb = threeSum(a); c[2] = ops;
        ops = 0; long t3 = threeSumFast(a);  c[3] = ops;
        ops = 0; long t2 = threeSumTwoPointer(a); c[4] = ops;
        if (t2 != tb || t3 != tb) printf("MISMATCH: %ld, %ld, %ld triples\n", tb, t3, t2);
        printf("%6d %14lld %14lld %16lld %16lld %16lld\n", N, c[0], c[1], c[2], c[3], c[4]);
    }
    printf("\nSame answers, very different costs: a faster algorithm beats a faster computer.\n");
    return 0;
}
