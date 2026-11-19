// CSS 343 - topic program: quicksort. Lomuto's partition and the recursion
// exactly as on the slides (and in the Quicksort chapter and Homework 8), the
// random pivot of Homework 8, and the numbers the slides quote: the partition
// of 3 7 1 9 4 8 6 2 5, the practice partition, the pivots of the whole sort,
// and the comparisons on shuffled, sorted and all-equal input. The counts come
// from a copy that also counts; main checks that it sorts like the plain one.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 quicksort.cpp -o quicksort
//   run:    ./quicksort
#include <iostream>
#include <random>
#include <string>
#include <vector>
using namespace std;

// Lomuto partition around the last element as pivot. Elements < pivot are moved
// to the front; the pivot ends in its final sorted slot, whose index is returned.
int partition(int a[], int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;                       // boundary of the "< pivot" region
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot)
            swap(a[++i], a[j]);           // grow the region, swap the element in
    swap(a[i + 1], a[hi]);                // drop the pivot just past the region
    return i + 1;                         // the pivot's final index
}

// Quicksort: partition, then recurse on each side. No combine step.
void quicksort(int a[], int lo, int hi) {
    if (hi <= lo) return;                 // base case: 0 or 1 element
    int p = partition(a, lo, hi);         // pivot lands at its final index p
    quicksort(a, lo, p - 1);              // sort the smaller side
    quicksort(a, p + 1, hi);              // sort the larger side
}

mt19937 rng(343);
int randomIndex(int lo, int hi) {         // a uniformly random index in [lo, hi]
    uniform_int_distribution<int> pick(lo, hi);
    return pick(rng);
}

// Homework 8's random pivot: move a random key to a[hi], then partition.
void quicksortRandom(int a[], int lo, int hi) {
    if (hi <= lo) return;
    swap(a[randomIndex(lo, hi)], a[hi]);  // a random pivot, moved to a[hi]
    int p = partition(a, lo, hi);
    quicksortRandom(a, lo, p - 1);
    quicksortRandom(a, p + 1, hi);
}

// ---- counted copies, for the numbers the slides quote ----------------------
long compares = 0;
vector<int> placed;                       // pivots in the order they land
int partitionCounted(int a[], int lo, int hi) {
    int pivot = a[hi], i = lo - 1;
    for (int j = lo; j < hi; j++)
        if (++compares, a[j] < pivot) swap(a[++i], a[j]);
    swap(a[i + 1], a[hi]);
    placed.push_back(a[i + 1]);
    return i + 1;
}
void quicksortCounted(int a[], int lo, int hi, bool random) {
    if (hi <= lo) return;
    if (random) swap(a[randomIndex(lo, hi)], a[hi]);
    int p = partitionCounted(a, lo, hi);
    quicksortCounted(a, lo, p - 1, random);
    quicksortCounted(a, p + 1, hi, random);
}

string show(const vector<int>& v) {
    string s;
    for (size_t i = 0; i < v.size(); i++) s += (i ? " " : "") + to_string(v[i]);
    return s;
}

long sortCount(vector<int> v, bool random) {
    vector<int> w = v;
    compares = 0; placed.clear();
    quicksortCounted(v.data(), 0, (int)v.size() - 1, random);
    if (random) quicksortRandom(w.data(), 0, (int)w.size() - 1);
    else quicksort(w.data(), 0, (int)w.size() - 1);
    if (v != w) cout << "MISMATCH: the counted copy sorts differently\n";
    return compares;
}

int main() {
    vector<int> a = {3, 7, 1, 9, 4, 8, 6, 2, 5};
    int p = partition(a.data(), 0, 8);
    cout << "partition 3 7 1 9 4 8 6 2 5 -> " << show(a) << ", pivot at " << p << "\n";
    vector<int> b = {5, 9, 3, 8, 6, 7};
    p = partition(b.data(), 0, 5);
    cout << "partition 5 9 3 8 6 7 -> " << show(b) << ", pivot at " << p << "\n";
    vector<int> c = {3, 7, 1, 9, 4, 8, 6, 2, 5};
    long n9 = sortCount(c, false);
    cout << "quicksort 3 7 1 9 4 8 6 2 5: pivots placed " << show(placed) << ", " << n9 << " comparisons\n";
    vector<int> sorted, shuffled = {3, 7, 1, 9, 4, 8, 6, 2, 5, 12, 10, 11}, equal(12, 7);
    for (int k = 1; k <= 12; k++) sorted.push_back(k);
    cout << "comparisons, 12 keys: shuffled " << sortCount(shuffled, false) << ", sorted " << sortCount(sorted, false)
         << ", all equal " << sortCount(equal, false) << "\n";
    vector<int> big;
    for (int k = 1; k <= 1000; k++) big.push_back(k);
    long fixedPivot = sortCount(big, false), randomPivot = sortCount(big, true);
    cout << "comparisons, sorted 1..1000: last-key pivot " << fixedPivot << ", random pivot " << randomPivot << "\n";
    return 0;
}
