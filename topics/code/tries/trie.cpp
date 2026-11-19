// CSS 343 - topic program: the R-way trie exactly as on the slides (the Tries
// chapter's code and Homework 10's conventions: R = 26 lowercase letters, the
// root is the empty string, longestPrefixOf returns a length or -1), with the
// slides' keys and every answer checked against brute force over the key list.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 trie.cpp -o trie
//   run:    ./trie
#include <iostream>
#include <string>
#include <vector>
using namespace std;

const int R = 26;                          // alphabet: lowercase a..z

struct Node {
    Node* next[R] = {};                    // one slot per possible character
    bool  isWord = false;
};

// search: follow next[c] for each character. Fall off -> absent; reach the
// end -> present iff the node it ENDS ON is word-marked (not necessarily a leaf).
bool search(Node* t, const string& key) {
    for (char ch : key) {
        int c = ch - 'a';
        if (!t->next[c]) return false;     // fell off: no such path
        t = t->next[c];
    }
    return t->isWord;                      // path exists: is it a word?
}

// insert: the same walk, creating only the MISSING nodes; mark the last one.
void insert(Node* t, const string& key) {
    for (char ch : key) {
        int c = ch - 'a';
        if (!t->next[c]) t->next[c] = new Node();   // create the missing suffix
        t = t->next[c];
    }
    t->isWord = true;                      // mark: a key ends here
}

// collect: emit every key stored in the subtree under t (DFS, in order).
void collect(Node* t, string& path, vector<string>& out) {
    if (t->isWord) out.push_back(path);    // a stored key ends here
    for (int c = 0; c < R; c++)
        if (t->next[c]) {
            path.push_back('a' + c);       // extend the path by this character
            collect(t->next[c], path, out);
            path.pop_back();
        }
}

// keysWithPrefix: walk down the prefix, then collect the subtree below it.
vector<string> keysWithPrefix(Node* t, const string& prefix) {
    vector<string> out;
    for (char ch : prefix) {
        t = t->next[ch - 'a'];
        if (!t) return out;                // no key starts with the prefix
    }
    string path = prefix;
    collect(t, path, out);
    return out;
}

// longestPrefixOf: the length of the longest stored key that is a prefix of s,
// or -1 if none is. One walk, remembering the last word-marked node passed.
int longestPrefixOf(Node* t, const string& s) {
    int best = t->isWord ? 0 : -1;         // the empty key, if stored
    for (int d = 0; d < (int)s.size(); d++) {
        t = t->next[s[d] - 'a'];
        if (!t) break;                     // fell off: no longer key
        if (t->isWord) best = d + 1;       // a key ends here: remember it
    }
    return best;
}

int countNodes(Node* t) { int n = 1; for (int c = 0; c < R; c++) if (t->next[c]) n += countNodes(t->next[c]); return n; }
void destroy(Node* t) { for (int c = 0; c < R; c++) if (t->next[c]) destroy(t->next[c]); delete t; }

int main() {
    Node* root = new Node();
    vector<string> keys = {"she", "sells", "sea", "shells", "by", "the", "shore", "shell"};
    for (const string& k : keys) insert(root, k);
    cout << "nodes: " << countNodes(root) << " for " << keys.size() << " keys\n";
    for (string q : {"shell", "shel", "sea", "se", "shore", "shores"})
        cout << "search(" << q << ") = " << (search(root, q) ? "found" : "absent") << "\n";
    for (string p : {"she", "sh", "s", "x"}) {
        cout << "keysWithPrefix(" << p << "):";
        for (const string& k : keysWithPrefix(root, p)) cout << " " << k;
        cout << "\n";
    }
    for (string s : {"shellsort", "shells", "sheet", "sx", "by"}) {
        int brute = -1;
        for (const string& k : keys) if (s.compare(0, k.size(), k) == 0 && (int)k.size() > brute) brute = k.size();
        cout << "longestPrefixOf(" << s << ") = " << longestPrefixOf(root, s) << " (brute force " << brute << ")\n";
    }
    Node* seven = new Node();
    for (string k : {"she", "sells", "sea", "shells", "by", "the", "shore"}) insert(seven, k);
    cout << "the seven keys of the TST figure: " << countNodes(seven) << " nodes, " << countNodes(seven) * R << " links\n";
    destroy(seven);
    Node* small = new Node();
    for (string k : {"she", "sea", "sells"}) insert(small, k);
    cout << "she, sea, sells: " << countNodes(small) << " nodes\n";
    destroy(small); destroy(root);
    return 0;
}
