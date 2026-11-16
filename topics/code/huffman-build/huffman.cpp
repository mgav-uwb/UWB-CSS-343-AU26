// CSS 343 - topic program: Huffman coding. Builds the tree with a min-heap,
// extracts the codes, encodes and decodes, and prints every number the slides
// quote: the CLRS codes and their 224 bits, "face", the decodes of 1010 and
// 10111111000, and the practice frequencies p:2 q:3 r:3 s:4 t:8.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 huffman.cpp -o huffman
//   run:    ./huffman
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

struct Node {
    long freq;
    char sym;                    // '\0' for an internal node
    long id;                     // creation order: ties go to the older node
    Node* left;
    Node* right;
};

struct HigherFreq {              // the SMALLEST frequency on top
    bool operator()(const Node* a, const Node* b) const {
        if (a->freq != b->freq) return a->freq > b->freq;
        return a->id > b->id;    // equal frequencies: the older node first
    }
};

// Merge the two lightest trees until one is left.
Node* buildHuffman(const vector<pair<char, long>>& freqs) {
    priority_queue<Node*, vector<Node*>, HigherFreq> pq;
    long nextId = 0;
    for (const pair<char, long>& p : freqs)
        pq.push(new Node{p.second, p.first, nextId++, nullptr, nullptr});
    while (pq.size() > 1) {
        Node* x = pq.top(); pq.pop();       // the two smallest frequencies
        Node* y = pq.top(); pq.pop();
        pq.push(new Node{x->freq + y->freq, '\0', nextId++, x, y});   // merge
    }
    return pq.top();                        // the single remaining root
}

// Walk the tree once: left adds '0', right adds '1', a leaf records its path.
void extractCodes(Node* node, string path, map<char, string>& code) {
    if (!node->left && !node->right) {      // a leaf: the path is its code
        code[node->sym] = path;
        return;
    }
    extractCodes(node->left, path + "0", code);
    extractCodes(node->right, path + "1", code);
}

string encode(const string& text, map<char, string>& code) {
    string bits;
    for (char c : text) bits += code[c];    // look up, concatenate: no separators
    return bits;
}

// Walk from the root: 0 goes left, 1 goes right; at a leaf, emit and restart.
string decode(Node* root, const string& bits) {
    string out;
    Node* node = root;
    for (char b : bits) {
        node = (b == '0') ? node->left : node->right;
        if (!node->left && !node->right) {  // a leaf: one codeword ends here
            out += node->sym;
            node = root;                    // restart for the next codeword
        }
    }
    return out;
}

void destroy(Node* node) {
    if (!node) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

void report(const string& label, const vector<pair<char, long>>& freqs) {
    Node* root = buildHuffman(freqs);
    map<char, string> code;
    extractCodes(root, "", code);
    long total = 0, chars = 0;
    cout << label << ":";
    for (const pair<char, long>& p : freqs) {
        cout << " " << p.first << "=" << code[p.first];
        total += p.second * code[p.first].size();
        chars += p.second;
    }
    cout << "; " << total << " bits for " << chars << " symbols\n";
    destroy(root);
}

int main() {
    vector<pair<char, long>> clrs = {{'a', 5}, {'b', 9}, {'c', 12}, {'d', 13}, {'e', 16}, {'f', 45}};
    report("CLRS", clrs);
    Node* root = buildHuffman(clrs);
    map<char, string> code;
    extractCodes(root, "", code);
    string bits = encode("face", code);
    cout << "face -> " << bits << " (" << bits.size() << " bits) -> " << decode(root, bits) << "\n";
    cout << "1010 -> " << decode(root, "1010") << "\n";
    cout << "10111111000 -> " << decode(root, "10111111000") << "\n";
    destroy(root);
    report("practice", {{'p', 2}, {'q', 3}, {'r', 3}, {'s', 4}, {'t', 8}});
    report("tie", {{'x', 1}, {'y', 1}, {'z', 2}, {'w', 4}});
    report("equal", {{'a', 8}, {'b', 8}, {'c', 8}, {'d', 8}});
    return 0;
}
