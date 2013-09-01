---
layout: post
title: "MathJax test"
date: 2013-09-01 12:15
comments: true
categories: 
---

### some integrals
$$\begin{align}
\int\_0^\infty x^n e^{-ax} \,dx &= \frac{n!}{a^{n+1}} \\\\\
\int\_0^\infty e^{-ax} \sin(bx) \,dx &= \frac{b}{a^2 + b^2} \\\\\
\int\_0^\infty e^{-ax} \cos(bx) \,dx &= \frac{a}{a^2 + b^2}
\end{align}$$

### currying
Given some function of three arguments $f : (X \times Y \times Z) \rightarrow N$, currying will transform $f$ into $\mathop{\mathrm{curry}}(f) : X \rightarrow \bigl( Y \rightarrow \left( Z \rightarrow N \right) \bigr)$, a chain of functions each taking one argument.


