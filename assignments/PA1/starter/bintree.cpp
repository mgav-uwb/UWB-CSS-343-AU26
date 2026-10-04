// CSS 343 · PA1: BinTree implementation SKELETON.
// Every method is a TODO except displayTree (given, for debugging). The
// skeleton compiles and links as-is; fill the TODOs and re-diff against
// expected-output.txt as you go.
//
// The AVL fix-up is Lecture 5's: heights, balance factors, the four rotation
// cases on the way back up the insertion path. Count every single rotation.
// REDBLACK mode is EXTRA CREDIT: the three-if left-leaning insert of the
// Red-Black Trees chapter and Lecture 6 (rotate-left · rotate-right ·
// flip-colors), with the root kept black. If you skip it, let REDBLACK mode
// behave like VANILLA.
//
// MERGE: design your own algorithm. Candidate directions (pick, combine, or
// invent): a loop over the other tree's keys calling insert; flatten both to
// sorted arrays, union-merge, rebuild; the same but STREAMING with two
// iterator stacks (never materialize the arrays); rebuild in place by
// rotating the trees into vines; or look up split/join merging. Predict your
// algorithm's time and space BEFORE you measure: the report reconciles the
// two, and the instructor's benchmark measures both.
//
// Useful fact if you rebuild balanced in REDBLACK mode: a perfectly balanced
// tree is a valid left-leaning red-black tree if the DEEPEST-level nodes are
// RED and all others BLACK (build with the upper median so the partial level
// leans left). If you merge by re-inserting, no color rule is needed.
#include "bintree.h"

// ---- GIVEN: displayTree (debugging aid; do not change) ---------------------
void BinTree::displayTree() const { displayRec(root, "Root:", 0); }
void BinTree::displayRec(Node* t, const string& tag, int depth) {
    if (!t) return;
    cout << string(4 * depth, ' ') << tag << ' ' << t->key << '\n';
    displayRec(t->left,  "L---", depth + 1);
    displayRec(t->right, "R---", depth + 1);
}

// ---- TODO 1: construction, destruction, deep copy --------------------------
BinTree::BinTree(Mode m) : root(nullptr), mode_(m) {}

BinTree::BinTree(const BinTree& other) : root(nullptr), mode_(other.mode_) {
    // TODO: deep-copy other's tree (copy height/red fields too) + the counters
    (void)other;
}

BinTree::~BinTree() {
    // TODO: delete every node (post-order)
}

BinTree& BinTree::operator=(const BinTree& other) {
    // TODO: guard self-assignment; free the current tree; deep-copy other's
    //       tree, mode, and counters
    (void)other;
    return *this;
}

// ---- TODO 2: comparison ------------------------------------------------------
bool BinTree::operator==(const BinTree& other) const {
    // TODO: same keys AND same structure, in lockstep (ignore mode/colors/heights)
    (void)other;
    return false;
}
bool BinTree::operator!=(const BinTree& other) const { return !(*this == other); }

// ---- TODO 3: queries -----------------------------------------------------------
Mode BinTree::mode() const { return mode_; }
long BinTree::rotations() const { return rot_; }
long BinTree::colorFlips() const { return flips_; }
long BinTree::mergeAuxBytes() const { return auxBytes_; }

bool BinTree::isEmpty() const {
    return true;   // TODO
}
int BinTree::size() const {
    return 0;      // TODO
}
int BinTree::treeHeight() const {
    return 0;      // TODO: #nodes on the longest root-to-leaf path (empty = 0)
}
bool BinTree::contains(int key) const {
    (void)key;
    return false;  // TODO: iterative BST search
}

// ---- TODO 4: insert, per mode -----------------------------------------------------
bool BinTree::insert(int key) {
    // TODO: duplicates return false in every mode. Then:
    //   VANILLA : plain recursive BST attach
    //   AVL     : attach, then rebalance up the path (heights, 4 cases; count
    //              each single rotation in rot_)
    //   REDBLACK: the left-leaning insert: attach RED, then on the way up
    //              rotate-left / rotate-right / flip-colors as the three ifs
    //              require (count rotations in rot_, flips in flips_);
    //              finally force the root black
    (void)key;
    return false;
}

// ---- TODO 5: remove (VANILLA only) --------------------------------------------------
bool BinTree::remove(int key) {
    // TODO: if mode_ != Mode::VANILLA return false (leave the tree unchanged).
    //       Otherwise Hibbard: leaf → unlink; one child → splice; two children
    //       → copy the in-order successor's key down, remove the successor.
    (void)key;
    return false;
}

// ---- TODO 6: flatten + merge ----------------------------------------------------------
void BinTree::toSortedArray(vector<int>& out) const {
    // TODO: in-order walk, push_back each key (do not modify the tree)
    (void)out;
}

void BinTree::mergeWith(const BinTree& other) {
    // TODO: YOUR merge algorithm: any approach meeting the header contract.
    //       Remember: set auxBytes_ to the peak heap bytes you allocated
    //       (count vector capacities, explicit stacks, and every new Node);
    //       keep `other` unchanged; handle mergeWith(*this).
    (void)other;
}

// ---- TODO 7: in-order print --------------------------------------------------------------
ostream& operator<<(ostream& os, const BinTree& t) {
    // TODO: in-order traversal, each key followed by one space, then a newline
    (void)t;
    os << '\n';
    return os;
}
