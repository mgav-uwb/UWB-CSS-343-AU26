// CSS 343 · PA1: BinTree: one interface, three trees.
// A binary search tree of int keys whose BALANCING POLICY is chosen at
// construction:
//   Mode::VANILLA : plain BST: no rebalancing (remove supported, Hibbard)
//   Mode::AVL     : height-balanced via rotations (insert-only; Lecture 5)
//   Mode::REDBLACK: Sedgewick's LEFT-LEANING red-black (insert-only; EXTRA CREDIT)
// plus mergeWith(): combine two trees into one: with an algorithm YOU design
// (see the contract below).
//
// The public interface below is FIXED (the given driver.cpp and our grading
// driver compile against it). Add your own private recursive helpers.
//
//   build:        g++ -std=c++17 -g bintree.cpp driver.cpp -o pa1
//   run:          ./pa1 > myoutput.txt && diff myoutput.txt expected-output.txt
//   leak-check:   valgrind --leak-check=full ./pa1      (PA1 IS LEAK-GRADED)
#ifndef BINTREE_H
#define BINTREE_H
#include <iostream>
#include <vector>
#include <string>
using namespace std;

enum class Mode { VANILLA, AVL, REDBLACK };

class BinTree {
public:
    explicit BinTree(Mode m = Mode::VANILLA);
    BinTree(const BinTree& other);              // deep copy (mode and counters too)
    ~BinTree();                                 // no leaks
    BinTree& operator=(const BinTree& other);   // deep assign (watch self-assignment)

    bool operator==(const BinTree& other) const;   // same keys AND same structure
    bool operator!=(const BinTree& other) const;   // (mode is NOT compared)

    Mode mode() const;
    bool isEmpty() const;
    int  size() const;
    int  treeHeight() const;                    // #nodes on the longest path; empty = 0
    bool contains(int key) const;

    bool insert(int key);                       // false on duplicate. After the plain
                                                // BST attach, fix up PER MODE:
                                                //   VANILLA: nothing
                                                //   AVL    : heights + rotations (Lecture 5)
                                                //   REDBLACK- rotate-left / rotate-right /
                                                //             flip-colors, root stays black
                                                //             (EXTRA CREDIT: if you skip it,
                                                //             REDBLACK may behave like VANILLA)
    bool remove(int key);                       // VANILLA only (Hibbard, successor);
                                                // in AVL/REDBLACK: return false, no change

    void toSortedArray(vector<int>& out) const; // in-order append; tree unchanged

    // mergeWith: YOUR ALGORITHM. The contract (checked by our grader and the
    // benchmark harness) is:
    //   1. afterwards this tree holds the UNION of the two key sets (shared
    //      keys once); `other` is unchanged; self-merge is safe
    //   2. the result is a valid BST and its height is ≤ 2·ceil(log2(n+1))
    //   3. the tree remains internally consistent for its mode: later
    //      insert()s must still keep the mode's height guarantee
    //   4. you record what the merge cost: set auxBytes_ to the PEAK number
    //      of heap bytes your merge allocated (vectors, stacks, new nodes -
    //      everything), so mergeAuxBytes() reports it
    // HOW you meet the contract is up to you: that is the design exercise,
    // and the benchmark measures time AND those bytes.
    void mergeWith(const BinTree& other);

    long mergeAuxBytes() const;                 // your instrumentation for the LAST merge

    long rotations() const;                     // total single rotations (a double = 2)
    long colorFlips() const;                    // REDBLACK flip-colors calls

    void displayTree() const;                   // GIVEN: Root:/L---/R--- debugging aid
    friend ostream& operator<<(ostream& os, const BinTree& t);  // in-order, space-separated, newline

private:
    struct Node {
        int   key;
        Node* left   = nullptr;
        Node* right  = nullptr;
        int   height = 0;                       // for AVL bookkeeping (your convention)
        bool  red    = false;                   // for REDBLACK bookkeeping
    };
    Node* root;
    Mode  mode_;
    long  rot_   = 0;                           // bump inside your rotation helpers
    long  flips_ = 0;                           // bump inside your flip-colors helper
    long  auxBytes_ = 0;                        // set by YOUR mergeWith (see above)

    static void displayRec(Node* t, const string& tag, int depth);   // GIVEN
    // TODO: declare your recursive helpers here (static is fine). You will want
    // at least: copy, destroy, structural-equality, per-mode insert fix-ups,
    // Hibbard remove, in-order collect, and the balanced rebuild for mergeWith.
};
#endif
