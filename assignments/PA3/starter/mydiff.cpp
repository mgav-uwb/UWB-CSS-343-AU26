// CSS 343 - PA3 mydiff: the command-line tool (GIVEN; do not change).
//
//   build:  g++ -std=c++17 -O2 diff.cpp mydiff.cpp -o mydiff
//   usage:  ./mydiff fileA fileB           unified diff, 3 context lines
//           ./mydiff -u N fileA fileB      unified diff, N context lines
//           ./mydiff --stat fileA fileB    counts only: runs lcsLines, the
//                                          rolling-row mode, which works on
//                                          files far too large for the table
//           ./mydiff --word i j fileA fileB
//                                          markLine on line i of A and line j of B
#include <fstream>
#include "diff.h"

int main(int argc, char** argv) {
    vector<string> args(argv + 1, argv + argc);
    int context = 3;
    bool stat = false, word = false;
    size_t wa = 0, wb = 0;
    size_t k = 0;
    while (k < args.size() && args[k][0] == '-') {
        if (args[k] == "--stat") { stat = true; k++; }
        else if (args[k] == "-u" && k + 1 < args.size()) { context = stoi(args[k + 1]); k += 2; }
        else if (args[k] == "--word" && k + 2 < args.size()) {
            word = true; wa = stoul(args[k + 1]); wb = stoul(args[k + 2]); k += 3;
        }
        else { cout << "unknown flag " << args[k] << '\n'; return 2; }
    }
    if (args.size() - k != 2) { cout << "usage: mydiff [--stat | -u N | --word i j] fileA fileB\n"; return 2; }
    ifstream fa(args[k]), fb(args[k + 1]);
    if (!fa || !fb) { cout << "cannot open input files\n"; return 1; }
    vector<string> A = fileLines(fa), B = fileLines(fb);

    if (stat) {
        long l = lcsLines(A, B);
        cout << "lines: " << A.size() << " vs " << B.size()
             << "   common: " << l
             << "   removed: " << (long)A.size() - l
             << "   added: "   << (long)B.size() - l << '\n';
        return 0;
    }
    if (word) {
        if (wa < 1 || wa > A.size() || wb < 1 || wb > B.size()) { cout << "line out of range\n"; return 1; }
        cout << markLine(A[wa - 1], B[wb - 1]) << '\n';
        return 0;
    }
    string u = unifiedDiff(A, B, context);
    if (u.empty()) { cout << "files are identical\n"; return 0; }
    cout << "--- " << args[k] << "\n+++ " << args[k + 1] << "\n" << u;
    return 0;
}
