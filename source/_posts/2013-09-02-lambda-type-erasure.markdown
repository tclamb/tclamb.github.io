---
layout: post
title: "lambda type erasure"
date: 2013-09-02 17:31
comments: false
categories: c++11 template-metaprogramming
---

Special thanks to [ecatmur](http://stackoverflow.com/users/567292/ecatmur) at [stackoverflow](http://stackoverflow.com/), from whose [work](http://stackoverflow.com/questions/11893141/inferring-the-call-signature-of-a-lambda-or-arbitrary-callable-for-make-functio) this is adapted. 

### the problem
The type of a lambda is specified by the standard to be anonymous. However, this makes templates depending on the arguments or return type of a lambda night impossible to easily code. The solution: ignore the type of the lambda entirely, and instead, "steal" its `operator()`, storing it in a `std::function`, whose call signature is easily determined.

In this article, we define a helper function (ala `make_unique`) that takes a lambda and transforms it into a `std::function` with the same call signature and function body.

### step 1: extract the call signature from lambda type
{% codeblock lang:cpp %}
template<typename T> struct remove_class {};
template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...)>       { using type = R(A...); };
template<typename R, typename C, typename... A>
    struct remove_class<R(C::*)(A...) const> { using type = R(A...); };
{% endcodeblock %}

Unfortunately, partial specializations of functions don't exist. Therefore, we have to create helper structs. These are ubiquitous in C++ template metaprogramming, so you should at least get comfortable with the concept.

Following the style of `<type_traits>`, we can define a helper struct that transforms the type of member functions into the call signature of a plain function with the same return type and argument types.

For a lambda, we are guaranteed by the standard that if the lambda isn't polymorphic (not a problem in C++11), it has an `operator()` with a well-defined call signature. Therefore, if we provide the type of its `operator()` (a class member function type), we can discard the class type (which is an "unknowable" lambda object type) and retain the return value and arguments. We do this.

### step 2: define helper type
{% codeblock lang:cpp %}
template<typename F>
using function_t = std::function< typename remove_class<
    decltype( &std::remove_reference<F>::type::operator() )
>::type >;
{% endcodeblock %}

Remember the ultimate goal is to define a helper function (ala `make_shared()`) that converts a lambda to a `std::function` of the same call signature. Thus, the return value should be a `std::function<R(a...)>`, with `R` being the return type and `A...` any arguments. Sounds like a problem for `remove_class`!

`std::remove_reference` allows this to work for both rvalues and lvalues of lambda types. In brief, `std::remove_reference<F>::type` is the same type as `F`, minus any number of `&` (i.e. if `F` is of type `int`, `int&` or `int&&`, it is of type `int`). So we are using `decltype` to get the call signature of its `operator()`, a member function. `remove_class` then removes the class from the member function call signature, and all that remains is what we expect.

In short, `function_t<[lambda type]>` is the equivalent `std::function` type of any given monomorphic lambda type.

### step 3: define helper function
{% codeblock lang:cpp %}
template <typename F>
function_t<F> make_function(F&& functor) {
    return {std::forward<F>(functor)};
}
{% endcodeblock %}

The helper function just forwards the given lambda to the constructor of the appropriate `std::function` constructor. This makes `auto f = make_function([](A... args) { /*stuff*/ });` equivalent to `std::function<R(A...)> f = [](A... args){ /*stuff*/ };` or `auto f = std::function<R(A...)>{ [](A... args){ /*stuff*/ } };`. Convenient, right?

### example usage
Here's a sample program utilizing `make_function()` as defined above.

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
Here's the complete definition of `make_function()` and `function_t`. Feel free to include this in any of your code without attribution to myself. Have fun!

{% codeblock make_function.h lang:cpp %}
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
