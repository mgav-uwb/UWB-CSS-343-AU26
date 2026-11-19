// CSS 343 - topic program: mergesort. The merge and the recursion exactly as
// on the slides (and in the Mergesort chapter and Homework 8), plus the numbers
// the slides quote: the merge of 2 5 8 with 1 3 9, a tie taken from the left,
// the inversions the merge counts, and the comparisons on sorted and shuffled
// input.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 mergesort.cpp -o mergesort
//   run:    ./mergesort
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Merge two adjacent sorted runs a[lo..mid] and a[mid+1..hi] into sorted order,
// using aux[] as scratch. Every element is copied once: Theta(n).
void merge(int a[], int lo, int mid, int hi, int aux[]) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];    // copy into scratch
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)              a[k] = aux[j++];    // left run exhausted
        else if (j > hi)          a[k] = aux[i++];    // right run exhausted
        else if (aux[j] < aux[i]) a[k] = aux[j++];    // take the smaller front
        else                      a[k] = aux[i++];    // ties take left: STABLE
    }
}

// Top-down mergesort: sort each half, then merge. T(n) = 2T(n/2) + Theta(n).
void mergesort(int a[], int lo, int hi, int aux[]) {
    if (hi <= lo) return;                 // base case: 0 or 1 element
    int mid = lo + (hi - lo) / 2;
    mergesort(a, lo, mid, aux);           // sort the left half
    mergesort(a, mid + 1, hi, aux);       // sort the right half
    merge(a, lo, mid, hi, aux);           // combine
}

// The same merge with its key comparisons counted, for the numbers the slides
// quote; main checks that it sorts exactly like the plain one.
long compares = 0;
void mergeCounted(int a[], int lo, int mid, int hi, int aux[]) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)                          a[k] = aux[j++];
        else if (j > hi)                      a[k] = aux[i++];
        else if (++compares, aux[j] < aux[i]) a[k] = aux[j++];
        else                                  a[k] = aux[i++];
    }
}
void mergesortCounted(int a[], int lo, int hi, int aux[]) {
    if (hi <= lo) return;
    int mid = lo + (hi - lo) / 2;
    mergesortCounted(a, lo, mid, aux);
    mergesortCounted(a, mid + 1, hi, aux);
    mergeCounted(a, lo, mid, hi, aux);
}

// Inversions: pairs i < j with a[i] > a[j], counted by brute force.
long inversions(const vector<int>& v) {
    long n = 0;
    for (size_t i = 0; i < v.size(); i++)
        for (size_t j = i + 1; j < v.size(); j++)
            if (v[i] > v[j]) n++;
    return n;
}

string show(const vector<int>& v) {
    string s;
    for (size_t i = 0; i < v.size(); i++) s += (i ? " " : "") + to_string(v[i]);
    return s;
}

long sortCount(vector<int> v) {           // comparisons to mergesort v
    vector<int> aux(v.size()), w = v;
    compares = 0;
    mergesortCounted(v.data(), 0, (int)v.size() - 1, aux.data());
    mergesort(w.data(), 0, (int)w.size() - 1, aux.data());
    if (v != w) cout << "MISMATCH: the counted copy sorts differently\n";
    return compares;
}

int main() {
    vector<int> m = {2, 5, 8, 1, 3, 9}, m2 = m, aux(6);
    compares = 0;
    mergeCounted(m.data(), 0, 2, 5, aux.data());
    merge(m2.data(), 0, 2, 5, aux.data());
    if (m != m2) cout << "MISMATCH\n";
    cout << "merge 2 5 8 | 1 3 9 -> " << show(m) << ", " << compares << " comparisons\n";
    vector<int> run = {38, 27, 43, 3, 9, 82, 10}, a = run, aux7(7);
    mergesort(a.data(), 0, 6, aux7.data());
    cout << "mergesort " << show(run) << " -> " << show(a) << "\n";
    cout << "inversions of " << show(run) << ": " << inversions(run) << "\n";
    vector<int> halves = {2, 5, 8, 1, 3, 9};
    cout << "inversions of 2 5 8 1 3 9: " << inversions(halves) << " (all across the halves)\n";
    vector<int> sorted, shuffled = {7, 2, 11, 5, 1, 9, 12, 4, 8, 3, 10, 6};
    for (int k = 1; k <= 12; k++) sorted.push_back(k);
    cout << "comparisons, 12 keys: sorted " << sortCount(sorted) << ", shuffled " << sortCount(shuffled) << "\n";
    return 0;
}
