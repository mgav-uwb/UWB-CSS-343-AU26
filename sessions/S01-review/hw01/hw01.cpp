// CSS 343 · Homework 1: C++, recursion, counting.
// Fill in the TODOs, then run the program.
//
//   build:        g++ -std=c++17 -g hw01.cpp -o hw01
//   run:          ./hw01
//   leak-check:   valgrind --leak-check=full ./hw01
//                 (practice this week: read the report, it is not graded)
//
// The Node struct, the IntList members marked GIVEN, count3, and main() (a
// unit-test battery) are GIVEN: do not edit them. You implement the seven
// TODOs. Run early and often: the tests report [PASS]/[FAIL] one by one.

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
class IntList {
public:
    IntList() = default;                          // GIVEN: the empty list
    ~IntList();                                   // TODO 1
    IntList(const IntList& other);                // TODO 2
    IntList& operator=(const IntList& other);     // TODO 3

    // GIVEN
    void pushFront(int key) { head = new Node(key, head); }
    void setFirst(int key)  { if (head) head->key = key; }
    const Node* first() const { return head; }
    vector<int> toVector() const {
        vector<int> v;
        for (const Node* p = head; p != nullptr; p = p->next) v.push_back(p->key);
        return v;
    }

private:
    Node* head = nullptr;
};

// ---- TODO 1: destructor -----------------------------------------------------
// Free every node this list owns. Afterwards the list owns nothing.
IntList::~IntList() {
    // TODO 1
}

// ---- TODO 2: copy constructor -----------------------------------------------
// Build this list as an independent copy of `other`: the same keys in the same
// order, in nodes of its own. `other` is unchanged.
IntList::IntList(const IntList& other) {
    // TODO 2
    (void)other;
}

// ---- TODO 3: copy assignment ------------------------------------------------
// Make this list an independent copy of `other`, releasing the nodes it owned
// before. Assigning a list to itself leaves it unchanged. Returns *this.
IntList& IntList::operator=(const IntList& other) {
    // TODO 3
    (void)other;
    return *this;
}

// ---- TODO 4: length, recursively --------------------------------------------
// The number of nodes in the chain that starts at p. No loops.
int length(const Node* p) {
    // TODO 4
    (void)p;
    return -1;
}

// ---- TODO 5: contains, recursively ------------------------------------------
// Does the chain that starts at p hold `key`? No loops.
bool contains(const Node* p, int key) {
    // TODO 5
    (void)p; (void)key;
    return false;
}

// ---- TODO 6: binary search, recursively, counting probes --------------------
// `a` is sorted ascending. Return the index of `key` within a[lo..hi], or -1 if
// it is absent. Add 1 to `probes` each time an element of `a` is compared with
// `key` (one probe per call that examines a middle element). No loops.
int bsearch(const vector<int>& a, int lo, int hi, int key, long& probes) {
    // TODO 6
    (void)a; (void)lo; (void)hi; (void)key; (void)probes;
    return -2;
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

// ---- TODO 7: k-sum, recursively, counting checks ----------------------------
// In how many ways can k elements be chosen from a[start..] so that they sum to
// `target`? Each way uses k distinct positions, and two ways that use the same
// positions are the same way. Add 1 to `checks` each time a complete choice of
// k elements is tested against the target.
long countK(const vector<int>& a, int start, int k, long target, long& checks) {
    // TODO 7
    (void)a; (void)start; (void)k; (void)target; (void)checks;
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

    cout << "T1 · destructor\n";
    long base = liveNodes;
    {
        IntList a;
        for (int k : {8, 5, 3, 2, 1}) a.pushFront(k);
        check(liveNodes - base == 5, "5 nodes alive while the list is in scope");
    }
    check(liveNodes - base == 0, "0 nodes alive after the list goes out of scope");

    cout << "T2 · copy constructor\n";
    base = liveNodes;
    {
        IntList a;
        a.pushFront(8); a.pushFront(5); a.pushFront(3);
        IntList b = a;
        check(b.toVector() == keys358, "the copy holds 3, 5, 8 in that order");
        check(liveNodes - base == 6, "the copy has 3 nodes of its own (6 alive)");
        b.setFirst(99);
        check(a.toVector() == keys358, "changing the copy leaves the original unchanged");
    }
    check(liveNodes - base == 0, "both lists freed, each node once");

    cout << "T3 · copy assignment\n";
    base = liveNodes;
    {
        IntList a, c;
        a.pushFront(8); a.pushFront(5); a.pushFront(3);
        c.pushFront(7); c.pushFront(6);
        c = a;
        check(c.toVector() == keys358, "after c = a, c holds 3, 5, 8");
        check(liveNodes - base == 6, "c's old 2 nodes were freed (6 alive)");
        IntList& same = c;
        c = same;
        check(c.toVector() == keys358, "self-assignment leaves the list unchanged");
        IntList d, e;
        e = d = a;
        check(d.toVector() == keys358 && e.toVector() == keys358, "e = d = a chains");
        IntList empty;
        c = empty;
        check(c.toVector().empty(), "assigning an empty list empties the target");
    }
    check(liveNodes - base == 0, "every node freed at the end of the scope");

    cout << "T4 · length\n";
    {
        IntList a;
        check(length(a.first()) == 0, "the empty list has length 0");
        a.pushFront(8); a.pushFront(5); a.pushFront(3);
        check(length(a.first()) == 3, "3 -> 5 -> 8 has length 3");
        for (int i = 0; i < 997; i++) a.pushFront(i);
        check(length(a.first()) == 1000, "a list of 1000 nodes has length 1000");
    }

    cout << "T5 · contains\n";
    {
        IntList a;
        check(!contains(a.first(), 3), "the empty list contains nothing");
        a.pushFront(8); a.pushFront(5); a.pushFront(3);
        check(contains(a.first(), 3), "finds the first key");
        check(contains(a.first(), 8), "finds the last key");
        check(!contains(a.first(), 4), "reports an absent key as absent");
    }

    cout << "T6 · binary search\n";
    {
        const vector<int> a = {3, 7, 12, 18, 21, 26, 30, 34, 41, 47, 52, 58, 63, 69, 75};
        int n = a.size();
        bool allFound = true;
        long worst = 0;
        for (int i = 0; i < n; i++) {
            long probes = 0;
            if (bsearch(a, 0, n - 1, a[i], probes) != i) allFound = false;
            if (probes > worst) worst = probes;
        }
        check(allFound, "every one of the 15 keys is found at its own index");
        long p63 = 0, p20 = 0;
        int at63 = bsearch(a, 0, n - 1, 63, p63);
        int at20 = bsearch(a, 0, n - 1, 20, p20);
        check(at63 == 12 && p63 == 4, "63 is found at index 12 in 4 probes");
        check(at20 == -1 && p20 == 4, "20 is absent, reported after 4 probes");
        check(worst == 4, "no search of 15 keys needs more than 4 probes");
        long p0 = 0;
        check(bsearch(a, 0, -1, 5, p0) == -1 && p0 == 0, "an empty range makes 0 probes");
    }

    cout << "T7 · k-sum\n";
    {
        const vector<int> small = {-40, -20, -10, 0, 5, 10, 30, 40};
        long checks = 0;
        long found = countK(small, 0, 3, 0, checks);
        check(found == 4, "the 8-number instance has 4 triples that sum to 0");
        check(checks == 56, "and takes 56 checks");

        const vector<int> four = {1, 2, 3, 4};
        checks = 0;
        found = countK(four, 0, 2, 5, checks);
        check(found == 2 && checks == 6, "{1,2,3,4}, k = 2, target 5: 2 pairs, 6 checks");

        const long expectChecks[] = {120, 1140, 9880};
        const int  sizes[]        = {10, 20, 40};
        bool sameAsLoops = true, sameChecks = true;
        for (int t = 0; t < 3; t++) {
            vector<int> a = testData(sizes[t], 343);
            long loopChecks = 0, recChecks = 0;
            long byLoops = count3(a, loopChecks);
            long byRec   = countK(a, 0, 3, 0, recChecks);
            if (byLoops != byRec) sameAsLoops = false;
            if (recChecks != expectChecks[t] || recChecks != loopChecks) sameChecks = false;
        }
        check(sameAsLoops, "k = 3 agrees with count3 at n = 10, 20, 40");
        check(sameChecks, "k = 3 makes 120, 1140, 9880 checks at n = 10, 20, 40");

        vector<int> a20 = testData(20, 343);
        checks = 0;
        found = countK(a20, 0, 4, 0, checks);
        check(found == 19 && checks == 4845, "n = 20, k = 4: 19 ways, 4845 checks");

        checks = 0;
        found = countK(four, 0, 0, 0, checks);
        check(found == 1 && checks == 1, "k = 0: the empty choice sums to 0 (1 way, 1 check)");
    }

    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
