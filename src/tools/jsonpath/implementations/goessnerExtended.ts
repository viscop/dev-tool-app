// @ts-nocheck

export type GoessnerOptions = {
    resultType?: "VALUE" | "PATH";
};

export function goessnerJsonPath(
    obj: unknown,
    expr: string,
    arg: GoessnerOptions = {},
): unknown[] | false {
    var P = {
        resultType: arg && arg.resultType || "VALUE",
        result: [],

        normalize: function (expr) {
            var subx = [];

            return P.protectExpressions(expr, subx)
                .replace(/\^\.\[/g, "^[")
                .replace(/'?\.'?|\['?/g, ";")
                .replace(/\^/g, ";^")
                .replace(/;;;|;;/g, ";..;")
                .replace(/;$|'?\]|'$/g, "")
                .replace(/#([0-9]+)/g, function ($0, $1) {
                    return subx[$1];
                });
        },
        protectExpressions: function (expr, subx) {
            var out = "";
            var i = 0;

            while (i < expr.length) {
                if (expr.charAt(i) === "[") {
                    var rest = expr.substring(i + 1);
                    var isExpression =
                        rest.indexOf("?(") === 0 ||
                        rest.indexOf("??(") === 0 ||
                        rest.indexOf("(") === 0;

                    if (isExpression) {
                        var end = P.findClosingBracket(expr, i);

                        if (end !== -1) {
                            var inner = expr.substring(i + 1, end);
                            out += "[#" + (subx.push(inner) - 1) + "]";
                            i = end + 1;
                            continue;
                        }
                    }
                }

                out += expr.charAt(i);
                i++;
            }

            return out;
        },
        findClosingBracket: function (value, start) {
            var depth = 0;
            var quote = null;

            for (var i = start; i < value.length; i++) {
                var ch = value.charAt(i);

                if (quote) {
                    if (ch === "\\") {
                        i++;
                    }
                    else if (ch === quote) {
                        quote = null;
                    }
                }
                else if (ch === "'" || ch === "\"") {
                    quote = ch;
                }
                else if (ch === "[") {
                    depth++;
                }
                else if (ch === "]") {
                    depth--;

                    if (depth === 0) {
                        return i;
                    }
                }
            }

            return -1;
        },
        asPath: function (path) {
            var x = path.split(";"), p = "$";
            for (var i = 1, n = x.length; i < n; i++)
                p += /^[0-9*]+$/.test(x[i]) ? ("[" + x[i] + "]") : ("['" + x[i] + "']");
            return p;
        },
        store: function (p, v) {
            if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
            return !!p;
        },
        trace: function (expr, val, path) {
            if (expr) {
                var x = expr.split(";"), loc = x.shift();
                x = x.join(";");
                if (val && val.hasOwnProperty(loc))
                    P.trace(x, val[loc], path + ";" + loc);
                else if (loc === "^")
                    P.parent(x, path);
                else if (loc === "*")
                    P.walk(loc, x, val, path, function (m, l, x, v, p) { P.trace(m + ";" + x, v, p); });
                else if (loc === "^")
                    P.parent(x, path);
                else if (loc === "..") {
                    P.trace(x, val, path);
                    P.walk(loc, x, val, path, function (m, l, x, v, p) { typeof v[m] === "object" && P.trace("..;" + x, v[m], p + ";" + m); });
                }
                else if (/,/.test(loc)) { // [name1,name2,...]
                    for (var s = loc.split(/'?,'?/), i = 0, n = s.length; i < n; i++)
                        P.trace(s[i] + ";" + x, val, path);
                }
                else if (/^\(.*?\)$/.test(loc)) // [(expr)]
                    P.trace(P.evaluate(loc, val, path.substr(path.lastIndexOf(";") + 1)) + ";" + x, val, path);
                else if (/^\?\?\(.*?\)$/.test(loc)) // [??(expr)] self filter
                    P.selfFilter(loc, x, val, path);
                else if (/^\?\(.*?\)$/.test(loc)) // [?(expr)]
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        if (P.evaluate(l.replace(/^\?\((.*?)\)$/, "$1"), v[m], m)) {
                            P.trace(m + ";" + x, v, p);
                        }
                    });
                else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) // [start:end:step]  phyton slice syntax
                    P.slice(loc, x, val, path);
            }
            else
                P.store(path, val);
        },
        walk: function (loc, expr, val, path, f) {
            if (val instanceof Array) {
                for (var i = 0, n = val.length; i < n; i++)
                    if (i in val)
                        f(i, loc, expr, val, path);
            }
            else if (typeof val === "object") {
                for (var m in val)
                    if (val.hasOwnProperty(m))
                        f(m, loc, expr, val, path);
            }
        },
        slice: function (loc, expr, val, path) {
            if (val instanceof Array) {
                var len = val.length, start = 0, end = len, step = 1;
                loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function ($0, $1, $2, $3) { start = parseInt($1 || start); end = parseInt($2 || end); step = parseInt($3 || step); });
                start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
                end = (end < 0) ? Math.max(0, end + len) : Math.min(len, end);
                for (var i = start; i < end; i += step)
                    P.trace(i + ";" + expr, val, path);
            }
        },
        evaluate: function (x, _v, _vname) {
            try {
                if (arg && arg.allowUnsafeEval === true) {
                    return P.evaluateUnsafe(x, _v);
                }

                var expression = P.parseExpression(x);
                return $ && P.evaluateExpression(expression, _v);
            }
            catch (e) {
                throw new SyntaxError(
                    "jsonPath: " +
                    e.message +
                    ": " +
                    x
                );
            }
        },
        evaluateUnsafe: function (x, _v) {
            var code = P.rewriteNestedFilters(x).replace(/@/g, "_v");
            return $ && eval(code);
        },
        parseExpression: function (source) {
            if (typeof source !== "string" || source.length > 4096) {
                P.expressionError(
                    "Expression must be a string of at most 4096 characters"
                );
            }

            var parser = {
                source: source,
                index: 0,
                token: null,
                previous: null,
                tokenCount: 0,
                depth: 0
            };

            P.nextExpressionToken(parser);

            var expression = P.parseLogicalOr(parser);

            if (parser.token.type !== "eof") {
                P.expressionError(
                    "Unsafe or unsupported token '" + parser.token.raw + "'"
                );
            }

            return expression;
        },
        nextExpressionToken: function (parser) {
            var source = parser.source;
            var length = source.length;

            parser.tokenCount++;

            if (parser.tokenCount > 512) {
                P.expressionError("Expression contains too many tokens");
            }

            while (parser.index < length && /\s/.test(source.charAt(parser.index))) {
                parser.index++;
            }

            parser.previous = parser.token;

            if (parser.index >= length) {
                parser.token = {
                    type: "eof",
                    value: "",
                    raw: ""
                };
                return;
            }

            var start = parser.index;
            var ch = source.charAt(parser.index);
            var next = source.charAt(parser.index + 1);
            var three = source.substr(parser.index, 3);
            var two = source.substr(parser.index, 2);

            if (ch === "'" || ch === "\"") {
                parser.token = P.readExpressionString(parser, ch);
                return;
            }

            if (
                ch === "/" &&
                P.expressionValueExpected(parser.previous)
            ) {
                parser.token = P.readExpressionRegex(parser);
                return;
            }

            if (
                (ch >= "0" && ch <= "9") ||
                (ch === "." && next >= "0" && next <= "9")
            ) {
                parser.index++;

                while (
                    parser.index < length &&
                    /[0-9.eE]/.test(source.charAt(parser.index))
                ) {
                    parser.index++;
                }

                if (
                    (source.charAt(parser.index) === "+" ||
                        source.charAt(parser.index) === "-") &&
                    /[eE]/.test(source.charAt(parser.index - 1))
                ) {
                    parser.index++;

                    while (
                        parser.index < length &&
                        /[0-9]/.test(source.charAt(parser.index))
                    ) {
                        parser.index++;
                    }
                }

                var numberRaw = source.substring(start, parser.index);
                var numberValue = Number(numberRaw);

                if (!isFinite(numberValue)) {
                    P.expressionError("Invalid number '" + numberRaw + "'");
                }

                parser.token = {
                    type: "number",
                    value: numberValue,
                    raw: numberRaw
                };
                return;
            }

            if (ch === "@" || /[A-Za-z_$]/.test(ch)) {
                parser.index++;

                if (ch !== "@") {
                    while (
                        parser.index < length &&
                        /[A-Za-z0-9_$]/.test(source.charAt(parser.index))
                    ) {
                        parser.index++;
                    }
                }

                var identifier = source.substring(start, parser.index);

                parser.token = {
                    type: ch === "@" ? "current" : "identifier",
                    value: identifier,
                    raw: identifier
                };
                return;
            }

            if (
                three === "===" ||
                three === "!=="
            ) {
                parser.index += 3;
                parser.token = {
                    type: "operator",
                    value: three,
                    raw: three
                };
                return;
            }

            if (
                two === "==" ||
                two === "!=" ||
                two === "<=" ||
                two === ">=" ||
                two === "&&" ||
                two === "||"
            ) {
                parser.index += 2;
                parser.token = {
                    type: "operator",
                    value: two,
                    raw: two
                };
                return;
            }

            if (/[!<>+\-*\/%]/.test(ch)) {
                parser.index++;
                parser.token = {
                    type: "operator",
                    value: ch,
                    raw: ch
                };
                return;
            }

            if (/[\(\)\[\]\.,\?]/.test(ch)) {
                parser.index++;
                parser.token = {
                    type: "punctuation",
                    value: ch,
                    raw: ch
                };
                return;
            }

            P.expressionError("Unsafe or unsupported character '" + ch + "'");
        },
        expressionValueExpected: function (previous) {
            if (!previous) {
                return true;
            }

            if (previous.type === "operator") {
                return true;
            }

            return (
                previous.type === "punctuation" &&
                (
                    previous.value === "(" ||
                    previous.value === "[" ||
                    previous.value === "," ||
                    previous.value === "?"
                )
            );
        },
        readExpressionString: function (parser, quote) {
            var source = parser.source;
            var start = parser.index;
            var value = "";

            parser.index++;

            while (parser.index < source.length) {
                var ch = source.charAt(parser.index++);

                if (ch === quote) {
                    return {
                        type: "string",
                        value: value,
                        raw: source.substring(start, parser.index)
                    };
                }

                if (ch === "\r" || ch === "\n") {
                    P.expressionError("Unterminated string literal");
                }

                if (ch !== "\\") {
                    value += ch;
                    continue;
                }

                if (parser.index >= source.length) {
                    P.expressionError("Unterminated string escape");
                }

                var escaped = source.charAt(parser.index++);
                var escapes = {
                    b: "\b",
                    f: "\f",
                    n: "\n",
                    r: "\r",
                    t: "\t",
                    v: "\v",
                    "0": "\0"
                };

                if (escapes.hasOwnProperty(escaped)) {
                    value += escapes[escaped];
                }
                else if (escaped === "x" || escaped === "u") {
                    var digits = escaped === "x" ? 2 : 4;
                    var hex = source.substr(parser.index, digits);

                    if (
                        hex.length !== digits ||
                        !/^[0-9A-Fa-f]+$/.test(hex)
                    ) {
                        P.expressionError("Invalid hexadecimal string escape");
                    }

                    value += String.fromCharCode(parseInt(hex, 16));
                    parser.index += digits;
                }
                else {
                    value += escaped;
                }
            }

            P.expressionError("Unterminated string literal");
        },
        readExpressionRegex: function (parser) {
            var source = parser.source;
            var start = parser.index;
            var pattern = "";
            var inClass = false;
            var closed = false;

            parser.index++;

            while (parser.index < source.length) {
                var ch = source.charAt(parser.index++);

                if (ch === "\r" || ch === "\n") {
                    P.expressionError("Unterminated regular expression");
                }

                if (ch === "\\") {
                    if (parser.index >= source.length) {
                        P.expressionError("Unterminated regular expression escape");
                    }

                    pattern += ch + source.charAt(parser.index++);
                    continue;
                }

                if (ch === "[") {
                    inClass = true;
                    pattern += ch;
                    continue;
                }

                if (ch === "]" && inClass) {
                    inClass = false;
                    pattern += ch;
                    continue;
                }

                if (ch === "/" && !inClass) {
                    closed = true;
                    break;
                }

                pattern += ch;
            }

            if (!closed) {
                P.expressionError("Unterminated regular expression");
            }

            var flagsStart = parser.index;

            while (
                parser.index < source.length &&
                /[A-Za-z]/.test(source.charAt(parser.index))
            ) {
                parser.index++;
            }

            var flags = source.substring(flagsStart, parser.index);

            if (pattern.length > 1024) {
                P.expressionError(
                    "Regular-expression patterns are limited to 1024 characters"
                );
            }

            if (!/^[gim]*$/.test(flags) || /(.).*\1/.test(flags)) {
                P.expressionError(
                    "Unsafe or unsupported regular-expression flags '" +
                    flags +
                    "'"
                );
            }

            try {
                new RegExp(pattern, flags);
            }
            catch (e) {
                P.expressionError("Invalid regular expression: " + e.message);
            }

            return {
                type: "regex",
                value: {
                    pattern: pattern,
                    flags: flags
                },
                raw: source.substring(start, parser.index)
            };
        },
        parseLogicalOr: function (parser) {
            var left = P.parseLogicalAnd(parser);

            while (P.expressionTokenIs(parser, "||")) {
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: "||",
                    left: left,
                    right: P.parseLogicalAnd(parser)
                };
            }

            return left;
        },
        parseLogicalAnd: function (parser) {
            var left = P.parseEquality(parser);

            while (P.expressionTokenIs(parser, "&&")) {
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: "&&",
                    left: left,
                    right: P.parseEquality(parser)
                };
            }

            return left;
        },
        parseEquality: function (parser) {
            var left = P.parseRelational(parser);

            while (
                P.expressionTokenIs(parser, "==") ||
                P.expressionTokenIs(parser, "!=") ||
                P.expressionTokenIs(parser, "===") ||
                P.expressionTokenIs(parser, "!==")
            ) {
                var operator = parser.token.value;
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: operator,
                    left: left,
                    right: P.parseRelational(parser)
                };
            }

            return left;
        },
        parseRelational: function (parser) {
            var left = P.parseAdditive(parser);

            while (
                P.expressionTokenIs(parser, "<") ||
                P.expressionTokenIs(parser, "<=") ||
                P.expressionTokenIs(parser, ">") ||
                P.expressionTokenIs(parser, ">=")
            ) {
                var operator = parser.token.value;
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: operator,
                    left: left,
                    right: P.parseAdditive(parser)
                };
            }

            return left;
        },
        parseAdditive: function (parser) {
            var left = P.parseMultiplicative(parser);

            while (
                P.expressionTokenIs(parser, "+") ||
                P.expressionTokenIs(parser, "-")
            ) {
                var operator = parser.token.value;
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: operator,
                    left: left,
                    right: P.parseMultiplicative(parser)
                };
            }

            return left;
        },
        parseMultiplicative: function (parser) {
            var left = P.parseUnary(parser);

            while (
                P.expressionTokenIs(parser, "*") ||
                P.expressionTokenIs(parser, "/") ||
                P.expressionTokenIs(parser, "%")
            ) {
                var operator = parser.token.value;
                P.nextExpressionToken(parser);
                left = {
                    type: "binary",
                    operator: operator,
                    left: left,
                    right: P.parseUnary(parser)
                };
            }

            return left;
        },
        parseUnary: function (parser) {
            if (
                P.expressionTokenIs(parser, "!") ||
                P.expressionTokenIs(parser, "+") ||
                P.expressionTokenIs(parser, "-")
            ) {
                var operator = parser.token.value;
                P.nextExpressionToken(parser);
                P.enterExpressionNesting(parser);
                var unaryValue = P.parseUnary(parser);
                P.leaveExpressionNesting(parser);

                return {
                    type: "unary",
                    operator: operator,
                    value: unaryValue
                };
            }

            return P.parsePrimary(parser);
        },
        parsePrimary: function (parser) {
            var token = parser.token;

            if (token.type === "number" || token.type === "string") {
                P.nextExpressionToken(parser);
                return {
                    type: "literal",
                    value: token.value
                };
            }

            if (token.type === "current") {
                P.nextExpressionToken(parser);
                return P.parseExpressionPath(parser, "current");
            }

            if (
                token.type === "identifier" &&
                token.value === "$"
            ) {
                P.nextExpressionToken(parser);
                return P.parseExpressionPath(parser, "root");
            }

            if (token.type === "identifier") {
                if (
                    token.value === "true" ||
                    token.value === "false" ||
                    token.value === "null" ||
                    token.value === "undefined"
                ) {
                    P.nextExpressionToken(parser);
                    return {
                        type: "literal",
                        value:
                            token.value === "true" ? true :
                                token.value === "false" ? false :
                                    token.value === "null" ? null :
                                        undefined
                    };
                }

                if (token.value === "String") {
                    P.nextExpressionToken(parser);
                    P.expectExpressionToken(parser, "(");
                    P.enterExpressionNesting(parser);
                    var argument = P.parseLogicalOr(parser);
                    P.leaveExpressionNesting(parser);
                    P.expectExpressionToken(parser, ")");

                    return {
                        type: "stringCall",
                        argument: argument
                    };
                }

                P.expressionError(
                    "Unsafe or unsupported identifier '" + token.value + "'"
                );
            }

            if (token.type === "regex") {
                P.nextExpressionToken(parser);
                P.expectExpressionToken(parser, ".");

                if (
                    parser.token.type !== "identifier" ||
                    parser.token.value !== "test"
                ) {
                    P.expressionError(
                        "Only regular-expression .test(...) is supported"
                    );
                }

                P.nextExpressionToken(parser);
                P.expectExpressionToken(parser, "(");
                P.enterExpressionNesting(parser);
                var testedValue = P.parseLogicalOr(parser);
                P.leaveExpressionNesting(parser);
                P.expectExpressionToken(parser, ")");

                return {
                    type: "regexTest",
                    pattern: token.value.pattern,
                    flags: token.value.flags,
                    argument: testedValue
                };
            }

            if (P.expressionTokenIs(parser, "(")) {
                P.nextExpressionToken(parser);
                P.enterExpressionNesting(parser);
                var grouped = P.parseLogicalOr(parser);
                P.leaveExpressionNesting(parser);
                P.expectExpressionToken(parser, ")");
                return grouped;
            }

            P.expressionError(
                "Expected a value but found '" + token.raw + "'"
            );
        },
        parseExpressionPath: function (parser, base) {
            var path = {
                type: "path",
                base: base,
                segments: [],
                containsFilter: false
            };

            while (true) {
                if (P.expressionTokenIs(parser, ".")) {
                    P.nextExpressionToken(parser);

                    if (parser.token.type !== "identifier") {
                        P.expressionError("Expected a property name after '.'");
                    }

                    path.segments[path.segments.length] = {
                        type: "property",
                        key: parser.token.value
                    };
                    P.nextExpressionToken(parser);
                    continue;
                }

                if (!P.expressionTokenIs(parser, "[")) {
                    break;
                }

                P.nextExpressionToken(parser);

                if (P.expressionTokenIs(parser, "?")) {
                    P.nextExpressionToken(parser);
                    P.expectExpressionToken(parser, "(");
                    P.enterExpressionNesting(parser);
                    var filter = P.parseLogicalOr(parser);
                    P.leaveExpressionNesting(parser);
                    P.expectExpressionToken(parser, ")");
                    P.expectExpressionToken(parser, "]");

                    path.segments[path.segments.length] = {
                        type: "filter",
                        expression: filter
                    };
                    path.containsFilter = true;
                    continue;
                }

                if (P.expressionTokenIs(parser, "*")) {
                    P.nextExpressionToken(parser);
                    P.expectExpressionToken(parser, "]");
                    path.segments[path.segments.length] = {
                        type: "wildcard"
                    };
                    continue;
                }

                var negative = false;

                if (P.expressionTokenIs(parser, "-")) {
                    negative = true;
                    P.nextExpressionToken(parser);
                }

                if (parser.token.type === "number") {
                    var index = parser.token.value;

                    if (index % 1 !== 0) {
                        P.expressionError("Array indices must be integers");
                    }

                    P.nextExpressionToken(parser);
                    P.expectExpressionToken(parser, "]");
                    path.segments[path.segments.length] = {
                        type: "index",
                        key: negative ? -index : index
                    };
                    continue;
                }

                if (!negative && parser.token.type === "string") {
                    var key = parser.token.value;
                    P.nextExpressionToken(parser);
                    P.expectExpressionToken(parser, "]");
                    path.segments[path.segments.length] = {
                        type: "property",
                        key: key
                    };
                    continue;
                }

                P.expressionError(
                    "Only literal properties, indices, wildcards, and filters " +
                    "are supported inside brackets"
                );
            }

            return path;
        },
        expectExpressionToken: function (parser, value) {
            if (!P.expressionTokenIs(parser, value)) {
                P.expressionError(
                    "Expected '" + value + "' but found '" +
                    parser.token.raw +
                    "'"
                );
            }

            P.nextExpressionToken(parser);
        },
        expressionTokenIs: function (parser, value) {
            return parser.token && parser.token.value === value;
        },
        enterExpressionNesting: function (parser) {
            parser.depth++;

            if (parser.depth > 64) {
                P.expressionError(
                    "Expression nesting is limited to 64 levels"
                );
            }
        },
        leaveExpressionNesting: function (parser) {
            parser.depth--;
        },
        expressionError: function (message) {
            throw new SyntaxError(message);
        },
        evaluateExpression: function (expression, current) {
            if (expression.type === "literal") {
                return expression.value;
            }

            if (expression.type === "path") {
                return P.evaluateExpressionPath(expression, current);
            }

            if (expression.type === "stringCall") {
                return String(P.evaluateExpression(expression.argument, current));
            }

            if (expression.type === "regexTest") {
                return new RegExp(
                    expression.pattern,
                    expression.flags
                ).test(P.evaluateExpression(expression.argument, current));
            }

            if (expression.type === "unary") {
                var unaryValue = P.evaluateExpression(expression.value, current);

                if (expression.operator === "!") {
                    return !unaryValue;
                }

                if (expression.operator === "+") {
                    return +unaryValue;
                }

                return -unaryValue;
            }

            if (expression.type === "binary") {
                var left = P.evaluateExpression(expression.left, current);

                if (expression.operator === "&&") {
                    return left && P.evaluateExpression(expression.right, current);
                }

                if (expression.operator === "||") {
                    return left || P.evaluateExpression(expression.right, current);
                }

                var right = P.evaluateExpression(expression.right, current);

                if (expression.operator === "===") {
                    return left === right;
                }

                if (expression.operator === "!==") {
                    return left !== right;
                }

                if (expression.operator === "==") {
                    return left == right;
                }

                if (expression.operator === "!=") {
                    return left != right;
                }

                if (expression.operator === "<") {
                    return left < right;
                }

                if (expression.operator === "<=") {
                    return left <= right;
                }

                if (expression.operator === ">") {
                    return left > right;
                }

                if (expression.operator === ">=") {
                    return left >= right;
                }

                if (expression.operator === "+") {
                    return left + right;
                }

                if (expression.operator === "-") {
                    return left - right;
                }

                if (expression.operator === "*") {
                    return left * right;
                }

                if (expression.operator === "/") {
                    return left / right;
                }

                if (expression.operator === "%") {
                    return left % right;
                }
            }

            P.expressionError("Unsupported expression");
        },
        evaluateExpressionPath: function (path, current) {
            var values = [
                path.base === "root" ? P.root : current
            ];

            for (var i = 0; i < path.segments.length; i++) {
                var segment = path.segments[i];
                var next = [];

                if (segment.type === "filter") {
                    for (var j = 0; j < values.length; j++) {
                        P.collectExpressionFilter(
                            values[j],
                            segment.expression,
                            next
                        );
                    }
                }
                else if (segment.type === "wildcard") {
                    for (var k = 0; k < values.length; k++) {
                        P.collectExpressionChildren(values[k], next);
                    }
                }
                else {
                    for (var m = 0; m < values.length; m++) {
                        P.collectExpressionMember(values[m], segment, next);
                    }
                }

                values = next;
            }

            if (path.containsFilter) {
                return values.length > 0;
            }

            return values.length > 0 ? values[0] : undefined;
        },
        collectExpressionFilter: function (value, expression, out) {
            var candidates = [];
            P.collectExpressionChildren(value, candidates);

            for (var i = 0; i < candidates.length; i++) {
                if (
                    P.expressionIsCurrentNode(expression) ||
                    P.evaluateExpression(expression, candidates[i])
                ) {
                    out[out.length] = candidates[i];
                }
            }
        },
        expressionIsCurrentNode: function (expression) {
            return (
                expression.type === "path" &&
                expression.base === "current" &&
                expression.segments.length === 0
            );
        },
        collectExpressionChildren: function (value, out) {
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    if (i in value) {
                        out[out.length] = value[i];
                    }
                }
            }
            else if (value !== null && typeof value === "object") {
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        out[out.length] = value[key];
                    }
                }
            }
        },
        collectExpressionMember: function (value, segment, out) {
            if (value === null || typeof value === "undefined") {
                return;
            }

            var key = segment.key;

            if (
                segment.type === "index" &&
                value instanceof Array &&
                key < 0
            ) {
                key = value.length + key;
            }

            var boxed = Object(value);

            if (Object.prototype.hasOwnProperty.call(boxed, key)) {
                out[out.length] = boxed[key];
            }
        },
        isIdentStart: function (ch) {
            return /[A-Za-z_$]/.test(ch);
        },
        isIdent: function (ch) {
            return /[A-Za-z0-9_$]/.test(ch);
        },
        quote: function (s) {
            return s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
        },
        rewriteNestedFilters: function (x) {
            var out = "";
            var i = 0;

            while (i < x.length) {
                if (x.charAt(i) !== "@") {
                    out += x.charAt(i);
                    i++;
                    continue;
                }

                var start = i;
                var j = i + 1;
                var path = "";
                var hasFilter = false;

                while (j < x.length) {
                    var ch = x.charAt(j);

                    if (ch === ".") {
                        var k = j + 1;

                        if (!P.isIdentStart(x.charAt(k))) {
                            break;
                        }

                        while (k < x.length && P.isIdent(x.charAt(k))) {
                            k++;
                        }

                        if (x.charAt(k) === "(") {
                            break;
                        }

                        path += x.substring(j, k);
                        j = k;
                    }
                    else if (ch === "[") {
                        var end = P.findClosingBracket(x, j);

                        if (end === -1) {
                            break;
                        }

                        var part = x.substring(j, end + 1);

                        if (/^\[\?\(/.test(part)) {
                            hasFilter = true;
                        }

                        path += part;
                        j = end + 1;
                    }
                    else {
                        break;
                    }
                }

                if (hasFilter && path) {
                    var quotedPath = P.quote(path).replace(/@/g, "\\x40");
                    out += 'P.nestedFilterExists(_v,"' + quotedPath + '")';
                    i = j;
                }
                else {
                    out += "@";
                    i = start + 1;
                }
            }

            return out;
        },
        nestedFilterExists: function (base, path) {
            var tokens = P.tokenizeNestedPath(path);
            var current = [base];

            for (var i = 0; i < tokens.length; i++) {
                var next = [];

                if (tokens[i].type === "filter") {
                    for (var j = 0; j < current.length; j++) {
                        P.collectFiltered(
                            current[j],
                            tokens[i].expression,
                            next
                        );
                    }
                }
                else {
                    for (var k = 0; k < current.length; k++) {
                        P.collectNested(current[k], tokens[i], next);
                    }
                }

                current = next;
            }

            return current.length > 0;
        },
        collectFiltered: function (val, expression, out) {
            P.walk(
                expression,
                "",
                val,
                "",
                function (m, filterExpression, x, container) {
                    if (
                        filterExpression === "@" ||
                        P.evaluate(filterExpression, container[m], m)
                    ) {
                        out[out.length] = container[m];
                    }
                }
            );
        },
        tokenizeNestedPath: function (path) {
            var tokens = [];
            var i = 0;

            while (i < path.length) {
                var ch = path.charAt(i);

                if (ch === ".") {
                    var j = i + 1;

                    while (j < path.length && P.isIdent(path.charAt(j))) {
                        j++;
                    }

                    tokens[tokens.length] = {
                        type: "property",
                        key: path.substring(i + 1, j)
                    };

                    i = j;
                }
                else if (ch === "[") {
                    var bracketEnd = P.findClosingBracket(path, i);

                    if (bracketEnd === -1) {
                        return tokens;
                    }

                    var inner = path.substring(i + 1, bracketEnd);

                    if (inner === "*") {
                        tokens[tokens.length] = {
                            type: "wildcard"
                        };
                    }
                    else if (/^-?[0-9]+$/.test(inner)) {
                        tokens[tokens.length] = {
                            type: "index",
                            key: parseInt(inner, 10)
                        };
                    }
                    else if (
                        (inner.charAt(0) === "'" && inner.charAt(inner.length - 1) === "'") ||
                        (inner.charAt(0) === "\"" && inner.charAt(inner.length - 1) === "\"")
                    ) {
                        tokens[tokens.length] = {
                            type: "property",
                            key: inner.substring(1, inner.length - 1)
                        };
                    }
                    else if (
                        inner.indexOf("?(") === 0 &&
                        inner.charAt(inner.length - 1) === ")"
                    ) {
                        tokens[tokens.length] = {
                            type: "filter",
                            expression: inner.substring(2, inner.length - 1)
                        };
                    }

                    i = bracketEnd + 1;
                }
                else {
                    i++;
                }
            }

            return tokens;
        },
        collectNested: function (val, token, out) {
            if (val === null || typeof val === "undefined") {
                return;
            }

            if (token.type === "wildcard") {
                if (val instanceof Array) {
                    for (var i = 0; i < val.length; i++) {
                        if (i in val) {
                            out[out.length] = val[i];
                        }
                    }
                }
                else if (typeof val === "object") {
                    for (var m in val) {
                        if (val.hasOwnProperty(m)) {
                            out[out.length] = val[m];
                        }
                    }
                }
            }
            else {
                var key = token.key;

                if (token.type === "index" && val instanceof Array && key < 0) {
                    key = val.length + key;
                }

                if (val && typeof val === "object" && val.hasOwnProperty(key)) {
                    out[out.length] = val[key];
                }
            }
        },

        parent: function (expr, path) {
            var idx = path.lastIndexOf(";");

            if (idx <= 0) {
                return;
            }

            var parentPath = path.substring(0, idx);
            var parentValue = P.valueFromPath(parentPath);

            if (typeof parentValue !== "undefined") {
                P.trace(expr, parentValue, parentPath);
            }
        },

        valueFromPath: function (path) {
            var parts = path.split(";");
            var val = P.root;

            for (var i = 1; i < parts.length; i++) {
                if (val === null || typeof val === "undefined") {
                    return undefined;
                }

                val = val[parts[i]];
            }

            return val;
        },

        selfFilter: function (loc, expr, val, path) {
            var filterExpr = loc.replace(/^\?\?\((.*?)\)$/, "$1");

            if (P.evaluate(filterExpr, val, path.substr(path.lastIndexOf(";") + 1))) {
                P.trace(expr, val, path);
            }
        },
    };

    //var $ = obj;
    var $ = obj;
    P.root = obj;

    if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
        P.trace(P.normalize(expr).replace(/^\$;/, ""), obj, "$");
        return P.result.length ? P.result : false;
    }

    return false;
}