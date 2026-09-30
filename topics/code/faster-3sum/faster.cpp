// CSS 343 · topic program: designing a faster algorithm
//
// Four algorithms for the same family of problems, with their operation counts,
// so the order-of-growth differences are visible:
//   TwoSum        brute force   ~ N^2
//   TwoSumFast    sort + binary search   ~ N log N
//   ThreeSum      brute force   ~ N^3
//   ThreeSumFast  sort + binary search   ~ N^2 log N
//
// Build & run:  g++ -std=c++17 -O2 faster.cpp -o faster && ./faster

#include <cstdio>
#include <cstdlib>
#include <vector>
#include <algorithm>
#include <random>
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

int main() {
    mt19937 rng(343);
    uniform_int_distribution<int> dist(-1000000, 1000000);
    printf("%6s %16s %16s %16s %16s\n",
           "N", "TwoSum N^2", "TwoSumFast NlgN", "ThreeSum N^3", "ThreeSumFast N^2lgN");
    for (int N = 1000; N <= 4000; N += N) {
        vector<int> a(N);
        for (int& x : a) x = dist(rng);
        long long c[4];
        ops = 0; twoSum(a);        c[0] = ops;
        ops = 0; twoSumFast(a);    c[1] = ops;
        ops = 0; threeSum(a);      c[2] = ops;
        ops = 0; threeSumFast(a);  c[3] = ops;
        printf("%6d %16lld %16lld %16lld %16lld\n", N, c[0], c[1], c[2], c[3]);
    }
    printf("\nSame answers, very different costs: a faster algorithm beats a faster computer.\n");
    return 0;
}
