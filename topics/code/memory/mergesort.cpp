// CSS 343 - topic program: mergesort's O(N) auxiliary space.
//   g++ -std=c++17 -O2 mergesort.cpp -o mergesort && ./mergesort
// The full algorithm. The memory point: each merge allocates a scratch buffer;
// the largest single buffer (the top-level merge) is N ints = 4N bytes, so the
// auxiliary space is O(N). (The recursion adds only O(log N) stack frames.)

#include <cstdio>
#include <vector>
using namespace std;

long long peakBufferBytes = 0;   // largest single merge buffer seen

void merge(vector<int>& a, int lo, int mid, int hi) {
    vector<int> tmp(hi - lo + 1);                 // O(range) scratch buffer
    long long bytes = (long long)tmp.size() * sizeof(int);
    if (bytes > peakBufferBytes) peakBufferBytes = bytes;

    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi)
        tmp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi)  tmp[k++] = a[j++];
    for (k = 0; k < (int)tmp.size(); k++) a[lo + k] = tmp[k];
}

void mergesort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;
    mergesort(a, lo, mid);
    mergesort(a, mid + 1, hi);
    merge(a, lo, mid, hi);
}

int main() {
    printf("%8s %18s %12s\n", "N", "peak merge buffer", "= 4N?");
    for (int N = 1000; N <= 16000; N += N) {
        vector<int> a(N);
        for (int i = 0; i < N; i++) a[i] = (N - i) * 7 % N;   // unsorted-ish
        peakBufferBytes = 0;
        mergesort(a, 0, N - 1);
        printf("%8d %15lld B %12s\n", N, peakBufferBytes,
               peakBufferBytes == 4LL * N ? "yes" : "no");
    }
    printf("\nMergesort: O(N log N) time, O(N) auxiliary space (the merge buffer).\n");
    return 0;
}
