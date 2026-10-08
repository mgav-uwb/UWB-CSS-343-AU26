// CSS 343 - PA1: given driver. Runs the SAME experiment in all three modes,
// then a merge. Deterministic: its output must match expected-output.txt:
//
//   g++ -std=c++17 -g bintree.cpp driver.cpp -o pa1
//   ./pa1 > myoutput.txt && diff myoutput.txt expected-output.txt
//
// This driver is the FLOOR, not the ceiling: it barely touches remove, never
// copies or self-assigns, and merges only one pair. Your own mydriver.cpp
// must exercise every method in the awkward states (and it is also the right
// place to TIME the naive insert-loop merge against mergeWith for the report).
#include "bintree.h"

static const char* name(Mode m) {
    return m == Mode::VANILLA ? "VANILLA" : m == Mode::AVL ? "AVL" : "REDBLACK";
}

int main() {
    // ---- the head-to-head: identical sorted stream, three policies ---------
    cout << "=== sorted stream 1..1023, three modes ===\n";
    for (Mode m : {Mode::VANILLA, Mode::AVL, Mode::REDBLACK}) {
        BinTree t(m);
        for (int k = 1; k <= 1023; k++) t.insert(k);
        cout << name(m) << ": size=" << t.size()
             << " height=" << t.treeHeight()
             << " rotations=" << t.rotations()
             << " colorFlips=" << t.colorFlips() << '\n';
    }

    // ---- small-tree sanity in each mode (shapes you can check by hand) -----
    cout << "\n=== insert 10,20,30 (the RR case) ===\n";
    for (Mode m : {Mode::VANILLA, Mode::AVL, Mode::REDBLACK}) {
        BinTree t(m);
        t.insert(10); t.insert(20); t.insert(30);
        cout << "-- " << name(m) << " (height " << t.treeHeight() << ")\n";
        t.displayTree();
    }

    // ---- duplicates, contains, remove ---------------------------------------
    cout << "\n=== semantics ===\n";
    BinTree v(Mode::VANILLA);
    for (int k : {50, 30, 70, 30, 50}) cout << "insert " << k << ": " << (v.insert(k) ? "ok" : "dup") << '\n';
    cout << "inorder: " << v;
    cout << "contains 30 / 99: " << v.contains(30) << " / " << v.contains(99) << '\n';
    cout << "remove 30 (vanilla): " << v.remove(30) << " -> " << v;
    BinTree a(Mode::AVL);
    a.insert(1); a.insert(2);
    cout << "remove in AVL mode is refused: " << a.remove(1) << ", tree intact: " << a;

    // ---- the merge (contract facts only: heights and costs are YOUR
    //      algorithm's business; the benchmark measures them) -------------------
    cout << "\n=== mergeWith: evens (AVL) absorb odds (VANILLA), some overlap ===\n";
    BinTree evens(Mode::AVL), odds(Mode::VANILLA);
    for (int k = 0; k <= 30; k += 2) evens.insert(k);
    for (int k = 1; k <= 30; k += 3) odds.insert(k);      // 1,4,7,...,28 (some even = overlap)
    evens.mergeWith(odds);
    cout << "merged: size=" << evens.size()
         << " heightOK=" << (evens.treeHeight() <= 10 ? "yes" : "NO") << '\n';   // 2*ceil(log2(22)) = 10
    cout << "merged inorder: " << evens;
    cout << "odds unchanged: " << odds;
    cout << "aux bytes reported: " << (evens.mergeAuxBytes() >= 0 ? "yes" : "NO") << '\n';
    evens.insert(99); evens.insert(98); evens.insert(97);
    cout << "post-merge inserts keep the AVL bound: "
         << (evens.treeHeight() <= 8 ? "yes" : "NO") << '\n';                    // 1.44*log2(26) ~ 6.8 -> <= 8
    return 0;
}
