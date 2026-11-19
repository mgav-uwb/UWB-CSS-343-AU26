// CSS 343 - topic program: quickselect. Lomuto's partition (as in quicksort)
// and the one-sided recursion exactly as on the slides (and in the Quickselect
// chapter and Homework 8), with the numbers the slides quote. The counts come
// from a copy that also counts; main checks every answer against a full sort.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 quickselect.cpp -o quickselect
//   run:    ./quickselect
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int partition(int a[], int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;                       // boundary of the "< pivot" region
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot)
            swap(a[++i], a[j]);           // grow the region, swap the element in
    swap(a[i + 1], a[hi]);                // drop the pivot just past the region
    return i + 1;                         // the pivot's final index
}

// Quickselect: the k-th smallest element (0-indexed). Partition, then recurse
// into ONLY the side that contains rank k. Average Theta(n). Reuses partition().
int quickselect(int a[], int lo, int hi, int k) {
    if (lo == hi) return a[lo];           // one element left
    int p = partition(a, lo, hi);         // pivot lands at rank p
    if (k == p)      return a[p];          // found it
    else if (k < p)  return quickselect(a, lo, p - 1, k);   // left side only
    else             return quickselect(a, p + 1, hi, k);   // right side only
}

// ---- counted copy, for the numbers the slides quote ------------------------
long compares = 0;
vector<string> calls;
int selectCounted(int a[], int lo, int hi, int k) {
    if (lo == hi) return a[lo];
    int pivot = a[hi], i = lo - 1;
    for (int j = lo; j < hi; j++)
        if (++compares, a[j] < pivot) swap(a[++i], a[j]);
    swap(a[i + 1], a[hi]);
    int p = i + 1;
    calls.push_back("(" + to_string(lo) + ", " + to_string(hi) + ") pivot " + to_string(a[p]) + " at " + to_string(p));
    if (k == p) return a[p];
    else if (k < p) return selectCounted(a, lo, p - 1, k);
    else return selectCounted(a, p + 1, hi, k);
}

void report(const vector<int>& v, int k, const string& name) {
    vector<int> x = v, y = v, s = v;
    compares = 0; calls.clear();
    int counted = selectCounted(x.data(), 0, (int)x.size() - 1, k);
    int plain = quickselect(y.data(), 0, (int)y.size() - 1, k);
    sort(s.begin(), s.end());
    if (counted != plain || plain != s[k]) cout << "MISMATCH\n";
    cout << "quickselect(k=" << k << ") on " << name << " = " << plain << ", " << compares << " comparisons, "
         << calls.size() << " partitions:";
    for (const string& c : calls) cout << " " << c << ";";
    cout << "\n";
}

int main() {
    vector<int> seven = {7, 2, 9, 4, 1, 6, 3}, nine = {3, 7, 1, 9, 4, 8, 6, 2, 5};
    report(seven, 4, "7 2 9 4 1 6 3");
    report(seven, 1, "7 2 9 4 1 6 3");
    report(nine, 4, "3 7 1 9 4 8 6 2 5");
    report(nine, 6, "3 7 1 9 4 8 6 2 5");
    vector<int> sorted;
    for (int k = 1; k <= 1000; k++) sorted.push_back(k);
    report(sorted, 0, "sorted 1..1000");
    return 0;
}
