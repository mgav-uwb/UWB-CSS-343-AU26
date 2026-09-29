// CSS 343 · Lecture 1 demo: recursion, traced and counted.
//   1. work before and after the recursive call
//   2. recursion on a list and on a tree
//   3. binary search, with every probe printed
//   4. Fibonacci and Towers of Hanoi, with the calls counted
//
//   build:  g++ -std=c++17 -O2 recursion.cpp -o recursion
//   run:    ./recursion
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// ---- 0. the two parts ------------------------------------------------------
long factorial(int n) {
    if (n <= 1) return 1;            // base case
    return n * factorial(n - 1);     // recursive case: a smaller n
}

// ---- 1. before and after ---------------------------------------------------
void downUp(int n) {
    if (n == 0) return;
    cout << n << " ";                // on the way down
    downUp(n - 1);
    cout << n << " ";                // on the way back up
}

// ---- 2. a list and a tree --------------------------------------------------
struct Node  { int key; Node* next; };
struct TNode { int key; TNode* left; TNode* right; };

int length(const Node* p) {
    if (p == nullptr) return 0;
    return 1 + length(p->next);
}

int height(const TNode* t) {         // nodes on the longest path; empty = 0
    if (t == nullptr) return 0;
    return 1 + max(height(t->left), height(t->right));
}

int size(const TNode* t) {
    if (t == nullptr) return 0;
    return 1 + size(t->left) + size(t->right);
}

void destroy(Node* p)  { if (p) { destroy(p->next); delete p; } }
void destroy(TNode* t) { if (t) { destroy(t->left); destroy(t->right); delete t; } }

// ---- 3. binary search ------------------------------------------------------
long probes = 0;                     // how many times a[mid] is examined
bool verbose = false;

int bsearch(const vector<int>& a, int lo, int hi, int key) {
    if (lo > hi) return -1;
    int mid = lo + (hi - lo) / 2;
    probes++;
    if (verbose)
        cout << "  lo=" << lo << " hi=" << hi << " mid=" << mid
             << " a[mid]=" << a[mid] << "\n";
    if (a[mid] == key) return mid;
    if (a[mid] <  key) return bsearch(a, mid + 1, hi, key);
    return bsearch(a, lo, mid - 1, key);
}

long worstProbes(int n) {            // the most probes any search of size n makes
    vector<int> a(n);
    for (int i = 0; i < n; i++) a[i] = 2 * i + 1;          // odd keys 1, 3, 5, ...
    long worst = 0;
    for (int key = 0; key <= 2 * n; key++) {               // hits and misses
        probes = 0;
        bsearch(a, 0, n - 1, key);
        worst = max(worst, probes);
    }
    return worst;
}

// ---- 4. counting calls -----------------------------------------------------
long fibCalls = 0;
long fib(int n) {
    fibCalls++;
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

long moves = 0;
void hanoi(int n, char from, char to, char via) {
    if (n == 0) return;
    hanoi(n - 1, from, via, to);
    moves++;                         // move disk n from -> to
    hanoi(n - 1, via, to, from);
}

int main() {
    cout << "factorial(4) = " << factorial(4) << "\n";
    cout << "downUp(3): ";
    downUp(3);
    cout << "\n\n";

    Node* list = new Node{3, new Node{5, new Node{8, nullptr}}};
    cout << "length(3 -> 5 -> 8) = " << length(list) << "\n";
    destroy(list);

    //            50
    //          /    \
    //        30      70
    //       /  \       \
    //     20    40      80
    //             \
    //              45
    TNode* t = new TNode{50,
        new TNode{30, new TNode{20, nullptr, nullptr},
                      new TNode{40, nullptr, new TNode{45, nullptr, nullptr}}},
        new TNode{70, nullptr, new TNode{80, nullptr, nullptr}}};
    cout << "tree: size = " << size(t) << ", height = " << height(t) << "\n";
    cout << "  height(30 subtree) = " << height(t->left)
         << ", height(70 subtree) = " << height(t->right)
         << ", height(40 subtree) = " << height(t->left->right) << "\n\n";
    destroy(t);

    vector<int> a = {3, 7, 12, 18, 21, 26, 30, 34, 41, 47, 52, 58, 63, 69, 75};
    verbose = true;
    for (int key : {63, 20}) {
        probes = 0;
        cout << "bsearch for " << key << " in 15 sorted keys:\n";
        int at = bsearch(a, 0, (int)a.size() - 1, key);
        cout << "  result = " << at << ", probes = " << probes << "\n";
    }
    verbose = false;

    cout << "\nworst-case probes by size:\n";
    for (int n : {1, 3, 7, 15, 16, 20, 1000, 1000000})
        cout << "  n = " << n << ": " << worstProbes(n) << "\n";

    cout << "\nfib, with calls counted:\n";
    for (int n : {5, 10, 20, 30}) {
        fibCalls = 0;
        long f = fib(n);
        cout << "  fib(" << n << ") = " << f << ", calls = " << fibCalls << "\n";
    }

    cout << "\nhanoi, with moves counted:\n";
    for (int n : {1, 2, 3, 4, 10, 20}) {
        moves = 0;
        hanoi(n, 'A', 'C', 'B');
        cout << "  n = " << n << ": " << moves << " moves\n";
    }
    return 0;
}
