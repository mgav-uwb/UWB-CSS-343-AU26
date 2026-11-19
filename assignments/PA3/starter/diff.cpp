// CSS 343 - PA3 mydiff: your implementation. fileLines is given; the four
// graded functions are TODOs. The DP is your Homework 8 LCS with lines in
// place of characters.
#include "diff.h"
#include <algorithm>

// ---- GIVEN: read a stream into lines (do not change) -----------------------
vector<string> fileLines(istream& in) {
    vector<string> v;
    string s;
    while (getline(in, s)) v.push_back(s);
    return v;
}

long lcsLines(const vector<string>& a, const vector<string>& b) {
    // TODO: the LCS LENGTH only, with TWO ROLLING ROWS: O(min(n, m)) memory.
    //       --stat runs this on files whose full n x m table would not fit.
    (void)a; (void)b;
    return 0;
}

vector<Edit> diffLines(const vector<string>& a, const vector<string>& b) {
    // TODO: 1) trim the common PREFIX and SUFFIX (they become ' ' edits);
    //       2) the full LCS table over what remains;
    //       3) the TRACEBACK into an edit script. Within a changed run, '-'
    //          lines come before '+' lines: a walk from the bottom-right
    //          corner meets them in reverse, so choose the tie-break with care.
    (void)a; (void)b;
    return {};
}

string unifiedDiff(const vector<string>& a, const vector<string>& b, int context) {
    // TODO: group the edit script into hunks: each run of changes plus
    //       `context` common lines on each side, headed
    //       "@@ -start,count +start,count @@". Prefix each body line with
    //       ' ', '-' or '+'. Return "" when the files are identical.
    //       Check yourself against expected-unified.txt.
    (void)a; (void)b; (void)context;
    return "";
}

string markLine(const string& a, const string& b) {
    // TODO: the SAME DP over characters. Render the traceback as
    //       [-deleted-] and {+inserted+}, one bracket pair per run of
    //       consecutive deleted (or inserted) characters.
    (void)a; (void)b;
    return "";
}

vector<Edit> diffLinesLinearSpace(const vector<string>& a, const vector<string>& b) {
    // EXTRA CREDIT (optional): Hirschberg's algorithm. Leave this stub if
    // you do not attempt it.
    (void)a; (void)b;
    return {};
}
