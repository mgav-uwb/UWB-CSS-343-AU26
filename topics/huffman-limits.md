<!--
  TOPIC · Encoding, decoding, and where Huffman loses.
  Teaches: encoding by concatenation, decoding by walking the tree and restarting at each leaf; decode in C++; a decode practice; the huffman-codes demo; why Huffman cannot lose to a fixed-length code on its own frequencies; where it does lose: a text that disagrees with the frequencies (Kraft's inequality), and the cost of sending the table; entropy as the floor; Huffman inside real compressors.
  Needs:   Huffman's algorithm, why Huffman is optimal.
  Demos:   huffman-codes (slide spec in topics/demos.js); figures hf-face, hf-deaf (tools/gen-greedy-figures.mjs)
  Program: code/huffman-build/huffman.cpp (encode, decode); the English, table and entropy numbers from lib/structures/huffman.js
  Budget:  ~15 min, 10 slides.
  Ported from Summer 2026 L12-greedy-huffman.md, part 4.
-->

### Encoding, decoding, and where Huffman loses

> Claude Shannon proved in 1948 that no code can average fewer bits per symbol than the entropy of its source, and that codes can come as close to it as desired.

<small>C. E. Shannon, “A Mathematical Theory of Communication,” Bell System Technical Journal 27, 1948</small>

--

## Encode and decode

<div><img src="../../topics/figures/greedy/hf-face.svg" style="height:200px" alt="
   codes: f=0 c=100 d=101 e=111 a=1100 b=1101
   encode &quot;face&quot;: 0 · 1100 · 100 · 111 → 01100100111 (11 bits, no separators)
   decode 1010: 1,0,1 → leaf d; restart; 0 → leaf f: &quot;df&quot;"></div>

- **encode**: look each symbol up, concatenate: no separators
- **decode**: walk from the root, 0 left and 1 right; at a leaf, emit it and **restart**

--

## Decoding, in C++

```cpp
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
```

One step per bit: $O(\text{bits})$. The decoder never looks ahead.

--

## Your turn: decode

With $f = 0$, $c = 100$, $d = 101$, $e = 111$, $a = 1100$, $b = 1101$, decode

`10111111000`

<details class="answer"><summary>Answer:</summary>

<div><img src="../../topics/figures/greedy/hf-deaf.svg" style="height:115px" alt="
   1,0,1 → d;  1,1,1 → e;  1,1,0,0 → a;  0 → f:  &quot;deaf&quot;"></div>

**deaf**: 11 bits, four symbols, no separators.

</details>

--

## Demo: encode and decode

<div class="algo-viz" data-algo="huffman-codes" data-config='{"width":900,"height":[180,104]}'>
<pre class="viz-fallback">
   the tree on top; under it three panels:  text | encoded bits | decoded text
   Encode reads the left panel and fills the middle;
   Decode reads the middle panel and fills the right.
   "face" → 01100100111 → "face"   (11 bits)
[ interactive demo: open this deck on the course site ]
</pre>
</div>

<small>Encode fills the middle panel from the left, Decode the right from the middle. Each symbol keeps one colour: a run of one colour is one codeword.</small>

--

## Can Huffman lose?

To a fixed-length code? Not on the frequencies it was built from:

- a fixed-length code **is** a prefix-free code: one tree among all of them
- Huffman's tree is optimal over **all** of them
- equal frequencies $8, 8, 8, 8$: the balanced tree, 2 bits each, saving **0**

The saving comes **only** from skew. Huffman does lose in two other ways.

--

## Loss 1: the wrong text

Built for average English: $e$ and the space get **3** bits; $j, q, x, z$ get **10**.

| text | $n$ | fixed, 5 bits | English code |
| --- | --: | --: | --: |
| `she sells sea…` | 37 | 185 | **138**, 75% |
| `the quick brown…` | 43 | 215 | **211**, 98% |
| `jazzy vixen quips` | 17 | 85 | **103**, 121% |

Kraft: $\sum\_s 2^{-\ell\_s} \le 1$, so short codewords **force** long ones.

--

## Loss 2: the table

The decoder needs the code. Say 8 bits to name each symbol, 4 for its length, then the codeword:

|  | `mississippi` | `abracadabra` |
| --- | --: | --: |
| characters, distinct symbols | 11, 4 | 11, 5 |
| ASCII | 88 bits | 88 bits |
| Huffman body | 21 bits | 23 bits |
| body + the table | 78 bits | **96 bits** |

On a short message with many symbols, the table eats the saving: **96 > 88**.

--

## Entropy: the floor

Shannon's **entropy**, with $p\_s$ the fraction of the text that is $s$:

$$H = -\sum\_s p\_s \log\_2 p\_s \quad \text{bits per symbol}$$

- $a \ldots f$: $H = 2.2199$, at least **222** bits; Huffman spends **224**
- Huffman is within **1 bit** per symbol of $H$; here, $0.02$
- **arithmetic coding** and **ANS** (asymmetric numeral systems) spend fractions of a bit

--

## Huffman in practice

- **DEFLATE** (ZIP, gzip, PNG): LZ77 replaces repeated strings by back-references, then Huffman codes the result
- **JPEG** and **MP3**: Huffman codes the quantized values
- **static** Huffman needs the frequencies **first**: two passes, or a table in the header
- **adaptive** Huffman builds and updates the code while it reads, so no table is sent

