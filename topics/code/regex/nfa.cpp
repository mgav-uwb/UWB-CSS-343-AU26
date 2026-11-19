// CSS 343 - topic program: regular expressions to NFAs and their simulation,
// exactly as on the slides. buildNFA and consumes are Homework 10's given code,
// with three comments shortened to fit a slide (Sedgewick's encoding of Thompson's construction, the regex wrapped in
// parentheses, states numbered in the wrapped regex); closure and matches are
// the chapter's simulation. main prints every machine, set and count the
// slides quote and checks matches against std::regex_match on every string
// over the regex's letters up to length 8.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 nfa.cpp -o nfa
//   run:    ./nfa
#include <iostream>
#include <map>
#include <regex>
#include <set>
#include <string>
#include <vector>
using namespace std;

struct NFA {
    string re;                                  // "(" + pattern + ")"
    int m;                                      // re.size(); state m accepts
    vector<vector<int>> eps;                    // eps[u]: e-edges out of u
};

NFA buildNFA(const string& pattern) {
    NFA nfa;
    nfa.re = "(" + pattern + ")";
    nfa.m = nfa.re.size();
    nfa.eps.assign(nfa.m + 1, vector<int>());
    const string& re = nfa.re;
    int m = nfa.m;
    vector<int> ops;                            // positions of ( and |
    for (int i = 0; i < m; i++) {
        int lp = i;                             // start of the atom ending at i
        if (re[i] == '(' || re[i] == '|') ops.push_back(i);
        else if (re[i] == ')') {
            int orPos = ops.back(); ops.pop_back();
            if (re[orPos] == '|') {             // wire the alternation
                lp = ops.back(); ops.pop_back();
                nfa.eps[lp].push_back(orPos + 1);
                nfa.eps[orPos].push_back(i);
            } else {
                lp = orPos;
            }
        }
        if (i < m - 1 && re[i + 1] == '*') {    // closure around lp..i
            nfa.eps[lp].push_back(i + 1);
            nfa.eps[i + 1].push_back(lp);
        }
        if (re[i] == '(' || re[i] == '*' || re[i] == ')')
            nfa.eps[i].push_back(i + 1);        // fall through a metacharacter
    }
    return nfa;
}

// does state u consume character c (and so step to u + 1)?
bool consumes(const NFA& nfa, int u, char c) {
    if (u >= nfa.m) return false;               // the accept state reads nothing
    char r = nfa.re[u];
    if (r == '(' || r == ')' || r == '|' || r == '*') return false;
    return r == c;
}

// e-closure: every state reachable from s by epsilon-edges alone (a DFS)
set<int> closure(const NFA& nfa, const set<int>& s) {
    set<int> seen = s;
    vector<int> stack(s.begin(), s.end());
    while (!stack.empty()) {
        int u = stack.back(); stack.pop_back();
        for (int v : nfa.eps[u])
            if (seen.insert(v).second) stack.push_back(v);   // first visit
    }
    return seen;
}

// does the regex match the whole of text? Track the set of active states.
bool matches(const NFA& nfa, const string& text) {
    set<int> pc = closure(nfa, {0});              // states reachable on ""
    for (char c : text) {
        set<int> next;
        for (int u : pc)                          // advance every letter state
            if (consumes(nfa, u, c)) next.insert(u + 1);
        pc = closure(nfa, next);                  // then close over e-edges
    }
    return pc.count(nfa.m) > 0;                   // the accept state is active?
}

// ---- checks and printing (not on the slides) ----
string str(const set<int>& s) {
    string out = "{";
    for (int x : s) out += (out.size() > 1 ? ", " : "") + to_string(x);
    return out + "}";
}

void printMachine(const string& pattern) {
    NFA nfa = buildNFA(pattern);
    cout << nfa.re << ": states 0.." << nfa.m << "; eps:";
    int ne = 0;
    for (int u = 0; u <= nfa.m; u++) for (int v : nfa.eps[u]) { cout << " " << u << "->" << v; ne++; }
    cout << " (" << ne << "); match:";
    int nm = 0;
    for (int u = 0; u < nfa.m; u++) if (consumes(nfa, u, nfa.re[u])) { cout << " " << u << "-" << nfa.re[u] << "->" << u + 1; nm++; }
    cout << " (" << nm << ")\n";
}

// the scan, one row per character: the stack after it and the edges it adds
void printScan(const string& pattern) {
    NFA full = buildNFA(pattern);
    string re = full.re; int m = full.m;
    vector<vector<int>> eps(m + 1);
    vector<int> ops;
    for (int i = 0; i < m; i++) {
        string added;
        int lp = i;
        if (re[i] == '(' || re[i] == '|') ops.push_back(i);
        else if (re[i] == ')') {
            int orPos = ops.back(); ops.pop_back();
            if (re[orPos] == '|') {
                lp = ops.back(); ops.pop_back();
                eps[lp].push_back(orPos + 1); added += " " + to_string(lp) + "->" + to_string(orPos + 1);
                eps[orPos].push_back(i); added += " " + to_string(orPos) + "->" + to_string(i);
            } else lp = orPos;
        }
        if (i < m - 1 && re[i + 1] == '*') {
            eps[lp].push_back(i + 1); added += " " + to_string(lp) + "->" + to_string(i + 1);
            eps[i + 1].push_back(lp); added += " " + to_string(i + 1) + "->" + to_string(lp);
        }
        if (re[i] == '(' || re[i] == '*' || re[i] == ')') { eps[i].push_back(i + 1); added += " " + to_string(i) + "->" + to_string(i + 1); }
        string st = "[";
        for (size_t k = 0; k < ops.size(); k++) st += (k ? "," : "") + to_string(ops[k]);
        cout << "  " << i << " " << re[i] << " stack " << st << "]" << " adds" << (added.empty() ? " -" : added) << "\n";
    }
    if (eps != full.eps) cout << "  SCAN DIFFERS FROM buildNFA\n";
}

void printRun(const string& pattern, const string& text) {
    NFA nfa = buildNFA(pattern);
    set<int> pc = closure(nfa, {0});
    cout << nfa.re << " on " << text << ": start " << str(pc);
    for (char c : text) {
        set<int> next;
        for (int u : pc) if (consumes(nfa, u, c)) next.insert(u + 1);
        pc = closure(nfa, next);
        cout << " | " << c << ": advance " << str(next) << " close " << str(pc);
    }
    cout << " -> " << (pc.count(nfa.m) ? "accept" : "reject") << " (matches " << matches(nfa, text) << ")\n";
}

// subset construction over the letters of the pattern: the number of DFA states
int subsetStates(const string& pattern, const string& letters) {
    NFA nfa = buildNFA(pattern);
    map<set<int>, int> id;
    vector<set<int>> todo;
    set<int> start = closure(nfa, {0});
    id[start] = 0; todo.push_back(start);
    for (size_t k = 0; k < todo.size(); k++)
        for (char c : letters) {
            set<int> next;
            for (int u : todo[k]) if (consumes(nfa, u, c)) next.insert(u + 1);
            set<int> d = closure(nfa, next);
            if (!id.count(d)) { int n = id.size(); id[d] = n; todo.push_back(d); }
        }
    return id.size();
}

long checked = 0, wrong = 0;
void crossCheck(const string& pattern, const string& letters, int maxLen) {
    NFA nfa = buildNFA(pattern);
    regex r(pattern);
    vector<string> layer = {""};
    for (int len = 0; len <= maxLen; len++) {
        vector<string> next;
        for (const string& s : layer) {
            checked++;
            if (matches(nfa, s) != regex_match(s, r)) { wrong++; cout << "  MISMATCH " << pattern << " on " << s << "\n"; }
            for (char c : letters) next.push_back(s + c);
        }
        layer = next;
    }
}

int main() {
    for (string p : {"A*B", "ABC", "A|B", "A*", "(A*B|AC)D", "(AB|C)*", "(A|B)*B"}) printMachine(p);
    cout << "scan of (A*B|AC)D:\n"; printScan("(A*B|AC)D");
    NFA ab = buildNFA("A*B"), big = buildNFA("(A*B|AC)D");
    cout << "closure {0} on (A*B): " << str(closure(ab, {0})) << "; on ((A*B|AC)D): " << str(closure(big, {0})) << "\n";
    for (string t : {"AAABD", "ABD", "ACD", "AAC", "BD", "D", "AACD"}) printRun("(A*B|AC)D", t);
    printRun("(AB|C)*", "CAB"); printRun("(AB|C)*", "ACB");
    for (string t : {"AB", "ABAB", "BA", "", "AABB", "CAB"}) cout << "(AB|C)* on '" << t << "': " << matches(buildNFA("(AB|C)*"), t) << "\n";
    cout << "subset states: (A|B)*B " << subsetStates("(A|B)*B", "AB");
    string kth = "(A|B)*A";
    for (int k = 1; k <= 5; k++) { cout << ", k=" << k << " " << subsetStates(kth, "AB") << " (NFA " << buildNFA(kth).m + 1 << " states)"; kth += "(A|B)"; }
    cout << ", (A*B|AC)D " << subsetStates("(A*B|AC)D", "ABCD") << "\n";
    for (string p : {"A*B", "(A*B|AC)D", "(AB|C)*", "(A|B)*B", "(A|B)*AB(A|B)*", "(A|B)*A(A|B)*A(A|B)*", "A*", "A|B", "ABC", "((A|B)(A|B))*"})
        crossCheck(p, "ABCD", 8);
    cout << "cross-checked " << checked << " (regex, string) pairs against std::regex_match, " << wrong << " wrong\n";
    return 0;
}
