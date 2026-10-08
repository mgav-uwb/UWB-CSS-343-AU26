// CSS 343 - Homework 3: recursion on binary trees.
// Fill in the TODOs, then run the program.
//
//   build:       g++ -std=c++17 -g hw03.cpp -o hw03
//   run:         ./hw03
//   leak-check:  valgrind --leak-check=full ./hw03      (CSS Linux lab)
//
// Everything marked GIVEN, and main() (a unit-test battery), must not be
// edited. You implement the five TODOs. Each is a recursion on the shape of a
// tree; none of them is on the slides as written, so read each contract
// carefully. Run early and often: the tests report [PASS]/[FAIL] one by one.

#include <iostream>
#include <vector>
#include <string>
#include <climits>
using namespace std;

// ---- GIVEN: the node, and a counter of nodes a function examines -------------
struct Node {
    int   key;              // a BST key, or an operand (when op is 0)
    char  op;               // expression trees only: '+', '-', '*', '/'; 0 for a number
    Node* left;
    Node* right;
};

long visits = 0;            // TODO 5 adds 1 for every node it examines

// ---- TODO 1: isBST ----------------------------------------------------------
// true if the tree rooted at t satisfies the BST ordering: at EVERY node, every
// key in its left subtree is smaller than the node's key and every key in its
// right subtree is larger. Keys are distinct. The empty tree is a BST.
// Checking only each node against its two children is NOT enough: a key deep in
// a left subtree must also be smaller than every ancestor it sits to the left of.
bool isBST(const Node* t) {
    // TODO 1 (hint: a helper that carries the range of keys allowed here)
    return false;
}

// ---- TODO 2: lowestCommonAncestor --------------------------------------------
// t is a valid BST that contains both a and b (a and b may be equal). Return
// the deepest node that has both a and b in its subtree, counting a node as in
// its own subtree. Use the ordering: the answer is found on ONE root-to-node path.
const Node* lowestCommonAncestor(const Node* t, int a, int b) {
    // TODO 2
    return nullptr;
}

// ---- TODO 3: isAVL -------------------------------------------------------------
// true if at every node the heights of the two subtrees differ by at most 1
// (the AVL balance condition; the BST ordering is not checked here). Height:
// the empty tree has height -1, a single node height 0.
// It must run in time proportional to the number of nodes: compute each
// subtree's height ONCE (calling a separate height() at every node is quadratic).
bool isAVL(const Node* t) {
    // TODO 3 (hint: a helper that returns the height, or a sentinel for "unbalanced")
    return false;
}

// ---- TODO 4: toInfix ---------------------------------------------------------------
// t is an expression tree: an internal node has op set and two children; a leaf
// has op == 0 and holds a number in key. Return the expression in infix with
// EVERY operator application in parentheses and no spaces. For example, the
// tree of 2 + 3 * 4 gives "(2+(3*4))", and a single leaf 7 gives "7".
// Negative numbers print as themselves: a leaf -5 gives "-5".
string toInfix(const Node* t) {
    // TODO 4
    return "";
}

// ---- TODO 5: countInRange ----------------------------------------------------------
// t is a valid BST and lo <= hi. Return how many keys k satisfy lo <= k <= hi.
// Add 1 to visits for every node you examine. Visit only nodes that can matter:
// skip a whole subtree when the ordering says none of its keys can be in range.
// (The tests check that your visits stay close to the number of keys counted
// plus twice the height.)
int countInRange(const Node* t, int lo, int hi) {
    // TODO 5
    return 0;
}

// ============================================================================
// GIVEN: tree building helpers and the unit-test battery. Do not edit below.
// ============================================================================
#ifndef HW03_GRADER
Node* leaf(int k) { return new Node{k, 0, nullptr, nullptr}; }
Node* node(int k, Node* l, Node* r) { return new Node{k, 0, l, r}; }
Node* opNode(char op, Node* l, Node* r) { return new Node{0, op, l, r}; }
void destroy(Node* t) { if (!t) return; destroy(t->left); destroy(t->right); delete t; }
Node* insert(Node* t, int k) {                     // plain BST insert, for building tests
    if (!t) return leaf(k);
    if (k < t->key) t->left = insert(t->left, k); else t->right = insert(t->right, k);
    return t;
}
int height(const Node* t) { return t ? 1 + max(height(t->left), height(t->right)) : -1; }

static int passCnt = 0, failCnt = 0;
static void check(bool ok, const char* what) {
    cout << (ok ? "  [PASS] " : "  [FAIL] ") << what << "\n";
    (ok ? passCnt : failCnt)++;
}

int main() {
    //          50
    //        /    \
    //      30      70
    //     /  \    /  \
    //   20   40  60   80
    //       /          \
    //      35           90
    Node* t = nullptr;
    for (int k : {50, 30, 70, 20, 40, 60, 80, 35, 90}) t = insert(t, k);

    cout << "T1 - isBST\n";
    {
        Node* one = leaf(1);
        check(isBST(t) && isBST(nullptr) && isBST(one), "the example tree, the empty tree and a single node are BSTs");
        destroy(one);
        // 35 sits in 50's LEFT subtree; replace it by 55: its parent 40 is fine, 50 is not
        Node* bad = node(50, node(30, leaf(20), node(40, leaf(55), nullptr)), leaf(70));
        check(!isBST(bad), "a key larger than an ancestor, deep in its left subtree, is caught");
        Node* bad2 = node(10, leaf(5), node(15, leaf(6), leaf(20)));
        check(!isBST(bad2), "a key smaller than an ancestor, deep in its right subtree, is caught");
        Node* bad3 = node(10, leaf(12), nullptr);
        check(!isBST(bad3), "a left child larger than its parent is caught");
        destroy(bad); destroy(bad2); destroy(bad3);
    }

    cout << "T2 - lowestCommonAncestor\n";
    {
        auto lca = [&](int a, int b) { const Node* r = lowestCommonAncestor(t, a, b); return r ? r->key : -1; };
        check(lca(20, 40) == 30, "LCA(20, 40) = 30");
        check(lca(35, 90) == 50, "LCA(35, 90) = 50");
        check(lca(30, 35) == 30, "LCA(30, 35) = 30: a node is its own ancestor");
        check(lca(60, 60) == 60, "LCA(60, 60) = 60");
    }

    cout << "T3 - isAVL\n";
    {
        check(isAVL(t) && isAVL(nullptr), "the example tree and the empty tree are balanced");
        Node* chain = nullptr;
        for (int k = 1; k <= 3; k++) chain = insert(chain, k);
        check(!isAVL(chain), "the path 1, 2, 3 is not balanced");
        // balanced at the root (heights 2 and 1) but not at 30 (heights 1 and -1)
        Node* deep = node(50, node(30, node(20, leaf(10), nullptr), nullptr), node(70, leaf(60), nullptr));
        check(!isAVL(deep), "an imbalance below the root is caught");
        destroy(chain); destroy(deep);
        Node* big = nullptr;                       // 1..1023 inserted median-first: perfect
        vector<pair<int,int>> todo = {{1, 1023}};
        while (!todo.empty()) {
            int lo = todo.back().first, hi = todo.back().second; todo.pop_back();
            if (lo > hi) continue;
            int mid = (lo + hi) / 2;
            big = insert(big, mid);
            todo.push_back({lo, mid - 1}); todo.push_back({mid + 1, hi});
        }
        check(isAVL(big) && height(big) == 9, "a perfect tree of 1023 keys is balanced");
        destroy(big);
    }

    cout << "T4 - toInfix\n";
    {
        Node* e1 = opNode('+', leaf(2), opNode('*', leaf(3), leaf(4)));
        check(toInfix(e1) == "(2+(3*4))", "2 + 3 * 4 gives (2+(3*4))");
        Node* e2 = opNode('*', opNode('+', leaf(2), leaf(3)), leaf(4));
        check(toInfix(e2) == "((2+3)*4)", "(2 + 3) * 4 gives ((2+3)*4)");
        Node* e3 = leaf(7);
        check(toInfix(e3) == "7", "a single number prints as itself");
        Node* e4 = opNode('/', opNode('-', leaf(10), leaf(-5)), leaf(3));
        check(toInfix(e4) == "((10--5)/3)", "negative operands print with their sign");
        destroy(e1); destroy(e2); destroy(e3); destroy(e4);
    }

    cout << "T5 - countInRange\n";
    {
        visits = 0;
        check(countInRange(t, 35, 65) == 4, "keys in [35, 65]: 35, 40, 50, 60");
        check(countInRange(t, 0, 100) == 9 && countInRange(t, 91, 99) == 0 && countInRange(t, 40, 40) == 1,
              "the whole range, an empty range, a single key");
        check(countInRange(nullptr, 1, 5) == 0, "the empty tree holds nothing");
        Node* big = nullptr;
        for (int k = 0; k < 4096; k++) big = insert(big, (int)((k * 2654435761u) % 100000));
        visits = 0;
        int c = countInRange(big, 50000, 50999);
        long bound = c + 2L * (height(big) + 1) + 2;
        check(c > 0 && visits <= bound, "on 4096 keys, visits stay within the count plus twice the height");
        destroy(big);
    }

    destroy(t);
    cout << "\n" << passCnt << " passed, " << failCnt << " failed\n";
    return failCnt == 0 ? 0 : 1;
}
#endif
