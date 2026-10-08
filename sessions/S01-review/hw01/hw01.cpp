// CSS 343 - Homework 1: C++, recursion, counting.
// Fill in the TODOs, then run the program.
//
//   build:        g++ -std=c++17 -g hw01.cpp -o hw01
//   run:          ./hw01
//   leak-check:   valgrind --leak-check=full ./hw01
//                 (practice this week: read the report, it is not graded)
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the seven TODOs. Each one is a relative of code from
// Lecture 1, not a copy of it: read its contract carefully. Run early and
// often: the tests report [PASS]/[FAIL] one by one.

#include <iostream>
#include <vector>
#include <string>
using namespace std;

// ---- GIVEN: the node, with a counter of nodes currently alive ---------------
long liveNodes = 0;

struct Node {
    int   key;
    Node* next;
    Node(int k, Node* n) : key(k), next(n) { liveNodes++; }
    ~Node() { liveNodes--; }
};

// ---- IntList: a singly linked list that OWNS its nodes ----------------------
// It keeps three members, and every member function must leave them
// consistent:
//   head   the first node, or nullptr when the list is empty
//   tail   the LAST node, or nullptr when the list is empty
//   count  the number of nodes
class IntList {
public:
    IntList() = default;                          // GIVEN: the empty list
    ~IntList();                                   // TODO 1
    IntList(const IntList& other);                // TODO 2
    IntList& operator=(const IntList& other);     // TODO 3

    // GIVEN
    void pushFront(int key) {
        head = new Node(key, head);
        if (tail == nullptr) tail = head;
        count++;
    }
    void pushBack(int key) {
        Node* n = new Node(key, nullptr);
        if (tail == nullptr) head = n; else tail->next = n;
        tail = n;
        count++;
    }
    void setFirst(int key) { if (head) head->key = key; }
    int size() const { return count; }
    const Node* first() const { return head; }
    const Node* last() const { return tail; }
    vector<int> toVector() const {
        vector<int> v;
        for (const Node* p = head; p != nullptr; p = p->next) v.push_back(p->key);
        return v;
    }
    // GIVEN: do head, tail and count agree with the chain of nodes?
    bool consistent() const {
        int n = 0;
        const Node* lastSeen = nullptr;
        for (const Node* p = head; p != nullptr; p = p->next) { n++; lastSeen = p; }
        return n == count && lastSeen == tail;
    }

private:
    Node* head = nullptr;
    Node* tail = nullptr;
    int   count = 0;
};

// ---- TODO 1: destructor -----------------------------------------------------
// Free every node this list owns.
IntList::~IntList() {
    // TODO 1
}

// ---- TODO 2: copy constructor -----------------------------------------------
// Build this list as an independent copy of `other`: the same keys in the same
// order, in nodes of its own, with head, tail and count consistent. `other` is
// unchanged.
IntList::IntList(const IntList& other) {
    // TODO 2
    (void)other;
}

// ---- TODO 3: copy assignment ------------------------------------------------
// Make this list an independent copy of `other`, releasing every node it owned
// before, with head, tail and count consistent afterwards. Assigning a list to
// itself leaves it unchanged. Returns *this.
IntList& IntList::operator=(const IntList& other) {
    // TODO 3
    (void)other;
    return *this;
}

// ---- TODO 4: sum, recursively -----------------------------------------------
// The sum of the keys in the chain that starts at p (0 for an empty chain).
// Recursive: no loops.
long sum(const Node* p) {
    // TODO 4
    (void)p;
    return -1;
}

// ---- TODO 5: occurrences, recursively ---------------------------------------
// How many nodes in the chain that starts at p hold `key`? Recursive: no loops.
int occurrences(const Node* p, int key) {
    // TODO 5
    (void)p; (void)key;
    return -1;
}

// ---- TODO 6: lower bound, recursively, counting probes ----------------------
// `a` is sorted ascending and may contain repeated keys. Return the FIRST index
// i in lo..hi with a[i] >= key; if there is none, return hi + 1. An empty range
// (lo > hi) returns lo. Add 1 to `probes` each time an element of `a` is
// compared with `key`. Recursive: no loops. Each call must examine at most one
// element and must discard at least half of the range it was given.
int lowerBound(const vector<int>& a, int lo, int hi, int key, long& probes) {
    // TODO 6
    (void)a; (void)lo; (void)hi; (void)key; (void)probes;
    return -1;
}

// ---- GIVEN: 3-sum with loops, counting checks -------------------------------
long count3(const vector<int>& a, long& checks) {
    int n = a.size();
    long cnt = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++) {
                checks++;
                if (a[i] + a[j] + a[k] == 0) cnt++;
            }
    return cnt;
}

// ---- TODO 7: find every k-sum, recursively ----------------------------------
// Find every way to choose k elements from a[start..] that sum to `target`,
// where `picked` holds the elements already chosen by the calls above this one.
// Append each complete choice to `found` as the full list of chosen elements,
// in the order they appear in `a`, and return how many choices were appended.
// Two choices that use the same positions are the same choice. Add 1 to
// `checks` each time a complete choice of k elements is tested against the
// target. When the call returns, `picked` must be as it was when it started.
long findK(const vector<int>& a, int start, int k, long target,
           vector<int>& picked, vector<vector<int>>& found, long& checks) {
    // TODO 7
    (void)a; (void)start; (void)k; (void)target; (void)picked; (void)found; (void)checks;
    return -1;
}

// ---- GIVEN: deterministic test data -----------------------------------------
// The same n integers in [-100, 100] on every compiler and every machine.
vector<int> testData(int n, unsigned seed) {
    vector<int> a(n);
    for (int& x : a) {
        seed = seed * 1664525u + 1013904223u;
        x = (int)((seed >> 16) % 201) - 100;
    }
    return a;
}

// ==========================================================================
// UNIT TESTS (given: do not edit).
// ==========================================================================
#ifndef HW01_GRADER
static int passCnt = 0, failCnt = 0;
static void check(bool ok, const string& what) {
    (ok ? passCnt : failCnt)++;
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << '\n';
}

int main() {
    const vector<int> keys358 = {3, 5, 8};

    cout << "T1 - destructor\n";
    long base = liveNodes;
    {
        IntList a;
        for (int k : {8, 5, 3, 2, 1}) a.pushFront(k);
        check(liveNodes - base == 5, "5 nodes alive while the list is in scope");
    }
    check(liveNodes - base == 0, "0 nodes alive after the list goes out of scope");

    cout << "T2 - copy constructor\n";
    base = liveNodes;
    {
        IntList a;
        a.pushBack(3); a.pushBack(5); a.pushBack(8);
        IntList b = a;
        check(b.toVector() == keys358 && b.consistent() && b.size() == 3,
              "the copy holds 3, 5, 8 in that order, with head, tail and count consistent");
        check(liveNodes - base == 6 && b.last() != a.last(), "the copy has 3 nodes of its own (6 alive)");
        b.setFirst(99);
        b.pushBack(10);
        check(a.toVector() == keys358 && a.consistent() && b.toVector() == vector<int>({99, 5, 8, 10}),
              "the copy changes on its own: pushBack goes to the copy's own tail");
        IntList e, f = e;
        check(f.size() == 0 && f.first() == nullptr && f.last() == nullptr, "copying an empty list gives an empty list");
    }
    check(liveNodes - base == 0, "both lists freed, each node once");

    cout << "T3 - copy assignment\n";
    base = liveNodes;
    {
        IntList a, c;
        a.pushBack(3); a.pushBack(5); a.pushBack(8);
        c.pushBack(7); c.pushBack(6);
        c = a;
        check(c.toVector() == keys358 && c.consistent(), "after c = a, c holds 3, 5, 8, consistent");
        check(liveNodes - base == 6, "c's old 2 nodes were freed (6 alive)");
        c.pushBack(1);
        check(a.toVector() == keys358 && c.size() == 4, "c = a gave c nodes of its own");
        IntList& same = a;
        a = same;
        check(a.toVector() == keys358 && a.consistent(), "self-assignment leaves the list unchanged");
        IntList d, e;
        e = d = a;
        check(d.toVector() == keys358 && e.toVector() == keys358 && e.consistent(), "e = d = a chains");
        IntList empty;
        c = empty;
        check(c.size() == 0 && c.first() == nullptr && c.last() == nullptr, "assigning an empty list empties the target");
    }
    check(liveNodes - base == 0, "every node freed at the end of the scope");

    cout << "T4 - sum\n";
    {
        IntList a;
        a.pushBack(3); a.pushBack(5); a.pushBack(8);
        check(sum(a.first()) == 16, "3 + 5 + 8 = 16");
        a.pushBack(-20);
        check(sum(a.first()) == -4 && sum(nullptr) == 0, "with -20 appended, -4; the empty chain sums to 0");
        IntList big;
        for (int i = 1; i <= 1000; i++) big.pushBack(i);
        check(sum(big.first()) == 500500, "1 + 2 + ... + 1000 = 500500");
    }

    cout << "T5 - occurrences\n";
    {
        IntList a;
        for (int k : {4, 1, 4, 4, 9, 4}) a.pushBack(k);
        check(occurrences(a.first(), 4) == 4, "4 appears 4 times in 4, 1, 4, 4, 9, 4");
        check(occurrences(a.first(), 9) == 1 && occurrences(a.first(), 1) == 1, "9 and 1 appear once each");
        check(occurrences(a.first(), 7) == 0 && occurrences(nullptr, 4) == 0, "7 does not appear; the empty chain holds nothing");
    }

    cout << "T6 - lower bound\n";
    {
        const vector<int> a = {3, 7, 12, 18, 21, 26, 30, 34, 41, 47, 52, 58, 63, 69, 75};
        int n = a.size();
        long p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        int r1 = lowerBound(a, 0, n - 1, 63, p1);
        int r2 = lowerBound(a, 0, n - 1, 20, p2);
        int r3 = lowerBound(a, 0, n - 1, 2, p3);
        int r4 = lowerBound(a, 0, n - 1, 80, p4);
        check(r1 == 12 && r2 == 4, "63 is at index 12; 20 would go at index 4, before 21");
        check(r3 == 0 && r4 == 15, "2 goes first (index 0); 80 is past the end (index 15)");
        check(p1 == 4 && p2 == 4 && p3 == 4 && p4 == 4, "each of those searches makes 4 probes");
        const vector<int> dup = {2, 4, 4, 4, 7, 9, 9, 12};
        long q1 = 0, q2 = 0, q3 = 0;
        check(lowerBound(dup, 0, 7, 4, q1) == 1 && lowerBound(dup, 0, 7, 9, q2) == 5 && lowerBound(dup, 0, 7, 5, q3) == 4,
              "with repeats: the first 4 is at 1, the first 9 at 5, and 5 would go at 4");
        long q0 = 0;
        check(lowerBound(dup, 3, 2, 5, q0) == 3 && q0 == 0, "an empty range returns lo and makes 0 probes");
    }

    cout << "T7 - find every k-sum\n";
    {
        const vector<int> small = {-40, -20, -10, 0, 5, 10, 30, 40};
        vector<int> picked;
        vector<vector<int>> found;
        long checks = 0;
        long n = findK(small, 0, 3, 0, picked, found, checks);
        const vector<vector<int>> want = {{-40, 0, 40}, {-40, 10, 30}, {-20, -10, 30}, {-10, 0, 10}};
        check(n == 4 && found == want, "the 8-number instance: (-40,0,40) (-40,10,30) (-20,-10,30) (-10,0,10)");
        check(checks == 56 && picked.empty(), "56 checks, and picked is empty again at the end");

        const vector<int> five = {1, 2, 3, 4, 5};
        found.clear(); checks = 0;
        n = findK(five, 0, 3, 9, picked, found, checks);
        check(n == 2 && found == vector<vector<int>>({{1, 3, 5}, {2, 3, 4}}) && checks == 10,
              "{1..5}, k = 3, target 9: (1,3,5) and (2,3,4), in 10 checks");

        bool sameAsLoops = true, sameChecks = true;
        const long expectChecks[] = {120, 1140, 9880};
        const int  sizes[]        = {10, 20, 40};
        for (int t = 0; t < 3; t++) {
            vector<int> a = testData(sizes[t], 343);
            long loopChecks = 0, recChecks = 0;
            found.clear();
            long byLoops = count3(a, loopChecks);
            long byRec   = findK(a, 0, 3, 0, picked, found, recChecks);
            if (byLoops != byRec || (long)found.size() != byRec) sameAsLoops = false;
            if (recChecks != expectChecks[t] || recChecks != loopChecks) sameChecks = false;
        }
        check(sameAsLoops, "k = 3 finds as many choices as count3 counts, at n = 10, 20, 40");
        check(sameChecks, "k = 3 makes 120, 1140, 9880 checks at n = 10, 20, 40");

        const vector<int> two = {5, 7};
        found.clear(); checks = 0;
        n = findK(two, 0, 0, 0, picked, found, checks);
        check(n == 1 && found.size() == 1 && found[0].empty() && checks == 1,
              "k = 0: the empty choice sums to 0 (one choice, one check)");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
