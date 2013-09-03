---
layout: post
title: "lambda type erasure"
date: 2013-09-02 17:31
comments: false
categories: 
---

### extracting call signature from lambda type
Thanks to [ecatmur](http://stackoverflow.com/users/567292/ecatmur) from [stackoverflow](http://stackoverflow.com/) for his work on [this question](http://stackoverflow.com/questions/11893141/inferring-the-call-signature-of-a-lambda-or-arbitrary-callable-for-make-functio).
{% codeblock lang:cpp %}
template<typename T> struct remove_class {};
template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...)>       { using type = R(A...); };
template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...) const> { using type = R(A...); };
{% endcodeblock %}

### lambda as a function
{% codeblock lang:cpp %}
template<typename F>
using function_t = std::function< typename remove_class<
    decltype( &std::remove_reference<F>::type::operator() )
>::type >;
{% endcodeblock %}

### helper function
{% codeblock lang:cpp %}
template <typename F>
function_t<F> make_function(F&& functor) {
    return {std::forward<F>(functor)};
}
{% endcodeblock %}

### example usage
{% codeblock lang:cpp %}
int main() {
    /* identity function: decltype( f ) == std::function<int(int)> */
    auto f = make_function([](int a){ return a; });

    /* zero function: decltype( make_function(g) ) == std::function<int()>
     * declared as mutable to test non-const R(C::*)(A...)
     * overload of remove_class
     * see 5.1.2:5 of standard for use of mutable with lambdas */
    int x = 1;
    auto g = [x]() mutable { x = 0; return x; };

    /* should return 0 */
    return f(0) + make_function(g)();
}
{% endcodeblock %}

### putting it all together
{% codeblock lang:cpp %}
#include <functional>
#include <type_traits>
#include <utility>

namespace
{
    /* SFNIAE helper struct for call signature extraction of
     * member functions */
    template<typename T> struct remove_class {};

    template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...)>
    {
        using type = R(A...);
    };

    template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...) const>
    {
        using type = R(A...);
    };
    
    /* lambda functions are never volatile (see 5.1.2:5 of the standard)
     * these specializations are provided for completeness */
    template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...) volatile>
    {
        using type = R(A...);
    };
    
    template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...) const volatile>
    {
        using type = R(A...);
    };
}
 
template<typename F>
using function_t = std::function< typename remove_class<
    decltype( &std::remove_reference<F>::type::operator() )
>::type >;
 
template <typename F>
function_t<F> make_function(F&& functor) {
    return {std::forward<F>(functor)};
}
{% endcodeblock %}
