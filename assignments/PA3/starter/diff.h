// CSS 343 - PA3 mydiff: the SPECIFICATION (do not change this file).
// A line-oriented diff, the tool git runs, built on the course's DP toolkit.
// The four functions below are the graded surface: the given mydiff.cpp and
// our grading driver both compile against exactly this header.
//   lcsLines     LCS LENGTH only, two rolling rows (works on huge files)
//   diffLines    the full edit script: LCS table + traceback
//   unifiedDiff  the edit script as hunks ("@@ -s,c +s,c @@")
//   markLine     the same DP over characters, marked up wdiff-style
// diffLinesLinearSpace is the extra credit (Hirschberg's algorithm).
#ifndef DIFF_H
#define DIFF_H
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Edit {
    char op;         // ' ' in both files, '-' only in A, '+' only in B
    string line;
};

vector<string> fileLines(istream& in);                 // GIVEN (in diff.cpp)

// The LCS LENGTH of two line sequences in O(min(n, m)) memory: two rolling
// rows. Must work on inputs whose full n x m table would not fit in memory.
long lcsLines(const vector<string>& a, const vector<string>& b);

// The full edit script. The common prefix and suffix are TRIMMED before the
// table is built (they re-enter the script as ' ' edits); then the LCS table
// over what remains, then the traceback. Within a changed run, deletions
// ('-') come before insertions ('+'). You may assume the trimmed sizes satisfy
// n * m <= 25,000,000.
vector<Edit> diffLines(const vector<string>& a, const vector<string>& b);

// The edit script as unified-diff hunks: each run of changes with `context`
// common lines around it, headed "@@ -start,count +start,count @@"; body
// lines start with ' ', '-' or '+' and end with '\n'. Two runs whose context
// would touch or overlap form one hunk. "" when the files are identical.
string unifiedDiff(const vector<string>& a, const vector<string>& b, int context = 3);

// The same DP one level down, over the characters of one A-line and one
// B-line. Deleted runs are wrapped "[-...-]", inserted runs "{+...+}".
// Removing every {+...+} and unwrapping every [-...-] gives a; the opposite
// gives b. The marked characters are as few as possible.
string markLine(const string& a, const string& b);

// EXTRA CREDIT: the same edit script as diffLines (optimal, '-' before '+'
// not required), in O(min(n, m)) memory: Hirschberg's divide and conquer.
// Leave the given stub in place if you do not attempt it.
vector<Edit> diffLinesLinearSpace(const vector<string>& a, const vector<string>& b);
#endif
