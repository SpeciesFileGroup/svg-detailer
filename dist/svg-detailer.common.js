module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "fb15");
/******/ })
/************************************************************************/
/******/ ({

/***/ "02f4":
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__("4588");
var defined = __webpack_require__("be13");
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};


/***/ }),

/***/ "0390":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var at = __webpack_require__("02f4")(true);

 // `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex
module.exports = function (S, index, unicode) {
  return index + (unicode ? at(S, index).length : 1);
};


/***/ }),

/***/ "0bfb":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 21.2.5.3 get RegExp.prototype.flags
var anObject = __webpack_require__("cb7c");
module.exports = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};


/***/ }),

/***/ "214f":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

__webpack_require__("b0c5");
var redefine = __webpack_require__("2aba");
var hide = __webpack_require__("32e9");
var fails = __webpack_require__("79e5");
var defined = __webpack_require__("be13");
var wks = __webpack_require__("2b4c");
var regexpExec = __webpack_require__("520a");

var SPECIES = wks('species');

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = (function () {
  // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length === 2 && result[0] === 'a' && result[1] === 'b';
})();

module.exports = function (KEY, length, exec) {
  var SYMBOL = wks(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL ? !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;
    re.exec = function () { execCalled = true; return null; };
    if (KEY === 'split') {
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES] = function () { return re; };
    }
    re[SYMBOL]('');
    return !execCalled;
  }) : undefined;

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var fns = exec(
      defined,
      SYMBOL,
      ''[KEY],
      function maybeCallNative(nativeMethod, regexp, str, arg2, forceStringMethod) {
        if (regexp.exec === regexpExec) {
          if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
            // The native String method already delegates to @@method (this
            // polyfilled function), leasing to infinite recursion.
            // We avoid it by directly calling the native @@method method.
            return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
          }
          return { done: true, value: nativeMethod.call(str, regexp, arg2) };
        }
        return { done: false };
      }
    );
    var strfn = fns[0];
    var rxfn = fns[1];

    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return rxfn.call(string, this); }
    );
  }
};


/***/ }),

/***/ "230e":
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__("d3f4");
var document = __webpack_require__("7726").document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),

/***/ "23c6":
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__("2d95");
var TAG = __webpack_require__("2b4c")('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};


/***/ }),

/***/ "28a5":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var isRegExp = __webpack_require__("aae3");
var anObject = __webpack_require__("cb7c");
var speciesConstructor = __webpack_require__("ebd6");
var advanceStringIndex = __webpack_require__("0390");
var toLength = __webpack_require__("9def");
var callRegExpExec = __webpack_require__("5f1b");
var regexpExec = __webpack_require__("520a");
var fails = __webpack_require__("79e5");
var $min = Math.min;
var $push = [].push;
var $SPLIT = 'split';
var LENGTH = 'length';
var LAST_INDEX = 'lastIndex';
var MAX_UINT32 = 0xffffffff;

// babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
var SUPPORTS_Y = !fails(function () { RegExp(MAX_UINT32, 'y'); });

// @@split logic
__webpack_require__("214f")('split', 2, function (defined, SPLIT, $split, maybeCallNative) {
  var internalSplit;
  if (
    'abbc'[$SPLIT](/(b)*/)[1] == 'c' ||
    'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 ||
    'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 ||
    '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 ||
    '.'[$SPLIT](/()()/)[LENGTH] > 1 ||
    ''[$SPLIT](/.?/)[LENGTH]
  ) {
    // based on es5-shim implementation, need to rework it
    internalSplit = function (separator, limit) {
      var string = String(this);
      if (separator === undefined && limit === 0) return [];
      // If `separator` is not a regex, use native split
      if (!isRegExp(separator)) return $split.call(string, separator, limit);
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      var splitLimit = limit === undefined ? MAX_UINT32 : limit >>> 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var match, lastIndex, lastLength;
      while (match = regexpExec.call(separatorCopy, string)) {
        lastIndex = separatorCopy[LAST_INDEX];
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          if (match[LENGTH] > 1 && match.index < string[LENGTH]) $push.apply(output, match.slice(1));
          lastLength = match[0][LENGTH];
          lastLastIndex = lastIndex;
          if (output[LENGTH] >= splitLimit) break;
        }
        if (separatorCopy[LAST_INDEX] === match.index) separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
      }
      if (lastLastIndex === string[LENGTH]) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
    };
  // Chakra, V8
  } else if ('0'[$SPLIT](undefined, 0)[LENGTH]) {
    internalSplit = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : $split.call(this, separator, limit);
    };
  } else {
    internalSplit = $split;
  }

  return [
    // `String.prototype.split` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.split
    function split(separator, limit) {
      var O = defined(this);
      var splitter = separator == undefined ? undefined : separator[SPLIT];
      return splitter !== undefined
        ? splitter.call(separator, O, limit)
        : internalSplit.call(String(O), separator, limit);
    },
    // `RegExp.prototype[@@split]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
    //
    // NOTE: This cannot be properly polyfilled in engines that don't support
    // the 'y' flag.
    function (regexp, limit) {
      var res = maybeCallNative(internalSplit, regexp, this, limit, internalSplit !== $split);
      if (res.done) return res.value;

      var rx = anObject(regexp);
      var S = String(this);
      var C = speciesConstructor(rx, RegExp);

      var unicodeMatching = rx.unicode;
      var flags = (rx.ignoreCase ? 'i' : '') +
                  (rx.multiline ? 'm' : '') +
                  (rx.unicode ? 'u' : '') +
                  (SUPPORTS_Y ? 'y' : 'g');

      // ^(? + rx + ) is needed, in combination with some S slicing, to
      // simulate the 'y' flag.
      var splitter = new C(SUPPORTS_Y ? rx : '^(?:' + rx.source + ')', flags);
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (S.length === 0) return callRegExpExec(splitter, S) === null ? [S] : [];
      var p = 0;
      var q = 0;
      var A = [];
      while (q < S.length) {
        splitter.lastIndex = SUPPORTS_Y ? q : 0;
        var z = callRegExpExec(splitter, SUPPORTS_Y ? S : S.slice(q));
        var e;
        if (
          z === null ||
          (e = $min(toLength(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)), S.length)) === p
        ) {
          q = advanceStringIndex(S, q, unicodeMatching);
        } else {
          A.push(S.slice(p, q));
          if (A.length === lim) return A;
          for (var i = 1; i <= z.length - 1; i++) {
            A.push(z[i]);
            if (A.length === lim) return A;
          }
          q = p = e;
        }
      }
      A.push(S.slice(p));
      return A;
    }
  ];
});


/***/ }),

/***/ "2aba":
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__("7726");
var hide = __webpack_require__("32e9");
var has = __webpack_require__("69a8");
var SRC = __webpack_require__("ca5a")('src');
var $toString = __webpack_require__("fa5b");
var TO_STRING = 'toString';
var TPL = ('' + $toString).split(TO_STRING);

__webpack_require__("8378").inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});


/***/ }),

/***/ "2b4c":
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__("5537")('wks');
var uid = __webpack_require__("ca5a");
var Symbol = __webpack_require__("7726").Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),

/***/ "2d00":
/***/ (function(module, exports) {

module.exports = false;


/***/ }),

/***/ "2d95":
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),

/***/ "2f21":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__("79e5");

module.exports = function (method, arg) {
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call
    arg ? method.call(null, function () { /* empty */ }, 1) : method.call(null);
  });
};


/***/ }),

/***/ "32e9":
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__("86cc");
var createDesc = __webpack_require__("4630");
module.exports = __webpack_require__("9e1e") ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),

/***/ "3846":
/***/ (function(module, exports, __webpack_require__) {

// 21.2.5.3 get RegExp.prototype.flags()
if (__webpack_require__("9e1e") && /./g.flags != 'g') __webpack_require__("86cc").f(RegExp.prototype, 'flags', {
  configurable: true,
  get: __webpack_require__("0bfb")
});


/***/ }),

/***/ "4588":
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),

/***/ "4630":
/***/ (function(module, exports) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),

/***/ "4bf8":
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__("be13");
module.exports = function (it) {
  return Object(defined(it));
};


/***/ }),

/***/ "4f37":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 21.1.3.25 String.prototype.trim()
__webpack_require__("aa77")('trim', function ($trim) {
  return function trim() {
    return $trim(this, 3);
  };
});


/***/ }),

/***/ "520a":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var regexpFlags = __webpack_require__("0bfb");

var nativeExec = RegExp.prototype.exec;
// This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.
var nativeReplace = String.prototype.replace;

var patchedExec = nativeExec;

var LAST_INDEX = 'lastIndex';

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/,
      re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1[LAST_INDEX] !== 0 || re2[LAST_INDEX] !== 0;
})();

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re[LAST_INDEX];

    match = nativeExec.call(re, str);

    if (UPDATES_LAST_INDEX_WRONG && match) {
      re[LAST_INDEX] = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      // eslint-disable-next-line no-loop-func
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

module.exports = patchedExec;


/***/ }),

/***/ "5537":
/***/ (function(module, exports, __webpack_require__) {

var core = __webpack_require__("8378");
var global = __webpack_require__("7726");
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: __webpack_require__("2d00") ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});


/***/ }),

/***/ "57e7":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $export = __webpack_require__("5ca1");
var $indexOf = __webpack_require__("c366")(false);
var $native = [].indexOf;
var NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !__webpack_require__("2f21")($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? $native.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments[1]);
  }
});


/***/ }),

/***/ "5ca1":
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__("7726");
var core = __webpack_require__("8378");
var hide = __webpack_require__("32e9");
var redefine = __webpack_require__("2aba");
var ctx = __webpack_require__("9b43");
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;


/***/ }),

/***/ "5f1b":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var classof = __webpack_require__("23c6");
var builtinExec = RegExp.prototype.exec;

 // `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec
module.exports = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw new TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }
  if (classof(R) !== 'RegExp') {
    throw new TypeError('RegExp#exec called on incompatible receiver');
  }
  return builtinExec.call(R, S);
};


/***/ }),

/***/ "626a":
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__("2d95");
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),

/***/ "6821":
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__("626a");
var defined = __webpack_require__("be13");
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),

/***/ "69a8":
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),

/***/ "6a99":
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__("d3f4");
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),

/***/ "6b54":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

__webpack_require__("3846");
var anObject = __webpack_require__("cb7c");
var $flags = __webpack_require__("0bfb");
var DESCRIPTORS = __webpack_require__("9e1e");
var TO_STRING = 'toString';
var $toString = /./[TO_STRING];

var define = function (fn) {
  __webpack_require__("2aba")(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if (__webpack_require__("79e5")(function () { return $toString.call({ source: 'a', flags: 'b' }) != '/a/b'; })) {
  define(function toString() {
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if ($toString.name != TO_STRING) {
  define(function toString() {
    return $toString.call(this);
  });
}


/***/ }),

/***/ "7726":
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),

/***/ "77f1":
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__("4588");
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),

/***/ "79e5":
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),

/***/ "8378":
/***/ (function(module, exports) {

var core = module.exports = { version: '2.6.11' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),

/***/ "86cc":
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__("cb7c");
var IE8_DOM_DEFINE = __webpack_require__("c69a");
var toPrimitive = __webpack_require__("6a99");
var dP = Object.defineProperty;

exports.f = __webpack_require__("9e1e") ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),

/***/ "87b3":
/***/ (function(module, exports, __webpack_require__) {

var DateProto = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var $toString = DateProto[TO_STRING];
var getTime = DateProto.getTime;
if (new Date(NaN) + '' != INVALID_DATE) {
  __webpack_require__("2aba")(DateProto, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}


/***/ }),

/***/ "9b43":
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__("d8e8");
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),

/***/ "9def":
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__("4588");
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),

/***/ "9e1e":
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__("79e5")(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ "a481":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var anObject = __webpack_require__("cb7c");
var toObject = __webpack_require__("4bf8");
var toLength = __webpack_require__("9def");
var toInteger = __webpack_require__("4588");
var advanceStringIndex = __webpack_require__("0390");
var regExpExec = __webpack_require__("5f1b");
var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var SUBSTITUTION_SYMBOLS = /\$([$&`']|\d\d?|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&`']|\d\d?)/g;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// @@replace logic
__webpack_require__("214f")('replace', 2, function (defined, REPLACE, $replace, maybeCallNative) {
  return [
    // `String.prototype.replace` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = defined(this);
      var fn = searchValue == undefined ? undefined : searchValue[REPLACE];
      return fn !== undefined
        ? fn.call(searchValue, O, replaceValue)
        : $replace.call(String(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
    function (regexp, replaceValue) {
      var res = maybeCallNative($replace, regexp, this, replaceValue);
      if (res.done) return res.value;

      var rx = anObject(regexp);
      var S = String(this);
      var functionalReplace = typeof replaceValue === 'function';
      if (!functionalReplace) replaceValue = String(replaceValue);
      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regExpExec(rx, S);
        if (result === null) break;
        results.push(result);
        if (!global) break;
        var matchStr = String(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }
      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];
        var matched = String(result[0]);
        var position = max(min(toInteger(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = [matched].concat(captures, position, S);
          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
          var replacement = String(replaceValue.apply(undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + S.slice(nextSourcePosition);
    }
  ];

    // https://tc39.github.io/ecma262/#sec-getsubstitution
  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
    if (namedCaptures !== undefined) {
      namedCaptures = toObject(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }
    return $replace.call(replacement, symbols, function (match, ch) {
      var capture;
      switch (ch.charAt(0)) {
        case '$': return '$';
        case '&': return matched;
        case '`': return str.slice(0, position);
        case "'": return str.slice(tailPos);
        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;
        default: // \d\d?
          var n = +ch;
          if (n === 0) return match;
          if (n > m) {
            var f = floor(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }
          capture = captures[n - 1];
      }
      return capture === undefined ? '' : capture;
    });
  }
});


/***/ }),

/***/ "aa77":
/***/ (function(module, exports, __webpack_require__) {

var $export = __webpack_require__("5ca1");
var defined = __webpack_require__("be13");
var fails = __webpack_require__("79e5");
var spaces = __webpack_require__("fdef");
var space = '[' + spaces + ']';
var non = '\u200b\u0085';
var ltrim = RegExp('^' + space + space + '*');
var rtrim = RegExp(space + space + '*$');

var exporter = function (KEY, exec, ALIAS) {
  var exp = {};
  var FORCE = fails(function () {
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if (ALIAS) exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function (string, TYPE) {
  string = String(defined(string));
  if (TYPE & 1) string = string.replace(ltrim, '');
  if (TYPE & 2) string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;


/***/ }),

/***/ "aae3":
/***/ (function(module, exports, __webpack_require__) {

// 7.2.8 IsRegExp(argument)
var isObject = __webpack_require__("d3f4");
var cof = __webpack_require__("2d95");
var MATCH = __webpack_require__("2b4c")('match');
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};


/***/ }),

/***/ "b0c5":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var regexpExec = __webpack_require__("520a");
__webpack_require__("5ca1")({
  target: 'RegExp',
  proto: true,
  forced: regexpExec !== /./.exec
}, {
  exec: regexpExec
});


/***/ }),

/***/ "be13":
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),

/***/ "c366":
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__("6821");
var toLength = __webpack_require__("9def");
var toAbsoluteIndex = __webpack_require__("77f1");
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};


/***/ }),

/***/ "c69a":
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__("9e1e") && !__webpack_require__("79e5")(function () {
  return Object.defineProperty(__webpack_require__("230e")('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ "ca5a":
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),

/***/ "cb7c":
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__("d3f4");
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),

/***/ "d3f4":
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),

/***/ "d8e8":
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),

/***/ "ebd6":
/***/ (function(module, exports, __webpack_require__) {

// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = __webpack_require__("cb7c");
var aFunction = __webpack_require__("d8e8");
var SPECIES = __webpack_require__("2b4c")('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};


/***/ }),

/***/ "f6fd":
/***/ (function(module, exports) {

// document.currentScript polyfill by Adam Miller

// MIT license

(function(document){
  var currentScript = "currentScript",
      scripts = document.getElementsByTagName('script'); // Live NodeList collection

  // If browser needs currentScript polyfill, add get currentScript() to the document object
  if (!(currentScript in document)) {
    Object.defineProperty(document, currentScript, {
      get: function(){

        // IE 6-10 supports script readyState
        // IE 10+ support stack trace
        try { throw new Error(); }
        catch (err) {

          // Find the second match for the "at" string to get file src url from stack.
          // Specifically works with the format of stack traces in IE.
          var i, res = ((/.*at [^\(]*\((.*):.+:.+\)$/ig).exec(err.stack) || [false])[1];

          // For all scripts on the page, if src matches or if ready state is interactive, return the script tag
          for(i in scripts){
            if(scripts[i].src == res || scripts[i].readyState == "interactive"){
              return scripts[i];
            }
          }

          // If no match, return null
          return null;
        }
      }
    });
  }
})(document);


/***/ }),

/***/ "fa5b":
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("5537")('native-function-to-string', Function.toString);


/***/ }),

/***/ "fb15":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/setPublicPath.js
// This file is imported into lib/wc client bundles.

if (typeof window !== 'undefined') {
  if (true) {
    __webpack_require__("f6fd")
  }

  var i
  if ((i = window.document.currentScript) && (i = i.src.match(/(.+\/)[^/]+\.js(\?.*)?$/))) {
    __webpack_require__.p = i[1] // eslint-disable-line
  }
}

// Indicate to webpack that this file can be concatenated
/* harmony default export */ var setPublicPath = (null);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.string.trim.js
var es6_string_trim = __webpack_require__("4f37");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.array.index-of.js
var es6_array_index_of = __webpack_require__("57e7");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.regexp.replace.js
var es6_regexp_replace = __webpack_require__("a481");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.regexp.split.js
var es6_regexp_split = __webpack_require__("28a5");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.regexp.to-string.js
var es6_regexp_to_string = __webpack_require__("6b54");

// EXTERNAL MODULE: ./node_modules/core-js/modules/es6.date.to-string.js
var es6_date_to_string = __webpack_require__("87b3");

// CONCATENATED MODULE: ./src/svg-detailer.js






// construct svgLayer from container's attributes and data-attributes

/*
Revised version of svg-detailer/svgDraw 06MAR2020
 */
var xC = 0;
var yC = 0;
var cursorMode = "MOVE";
var cursorColor;
var zoom; // set on initialization from baseZoom @ full image

var baseStrokeWidth = 1;
var baseBubbleRadius = 6; // transform below to functions?

var strokeWidth; //= (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)

var bubbleRadius; //= (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)

var baseZoom; // calculated from svg and image attributes

var maxZoom = 4; // this is 4 pixels per source image pixel

var zoomDelta = 0.02; // this can be altered to discriminate legacy firefox dommousescroll event

var svgLayer;
var svgImage;
var thisSVGpoints = []; // collect points as [x,y]

var svgOffset; // set on document ready ////////// test against fully packaged code

var svgMenu; // object built to be the element type selection and control menu

var isMac = /Mac/.test(navigator.platform); // store whether we are running on a Mac

var capsLock = false;
var thisKey;
var firstKey;
var secondKey; // converted to thisElement: var thisSvgText;            // pointer to svg text element currently being populated

var text4svg = '_'; // buffer replacing HTML input control previously used for text, prime with underscore cursor

var textHeight = 75;
var textFont = 'Verdana';
var arrowPercent = 10; // defalt arrow head size 10$

var arrowheadLength = 50; // or 50 pixels

var arrowFixed = false; // paired with above

var arrowClosed = false;
var waitElement = false; // interlock flag to prevent mouseenter mode change after selecting a create mode

var thisGroup; // should be the parent of the current element

var savedCursorMode = cursorMode;
var thisElement; // should be the current element

var thisBubble; // the bubble mousedown-ed in the currently edited element

var svgInProgress = false;
var lastMouseX;
var lastMouseY; // var logMouse = false;       // debug
// var logStatus = false;      // flags
// var logIndex = 0;           // limit counter for above

var _MAP = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  224: 'meta'
};
/*
 * mapping for special characters
 */

var _KEYCODE_MAP = {
  61: '=',
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111: '/',
  173: '-',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: '\''
};
var _SHIFTMAP = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  ';': ':',
  '\'': '\"',
  '[': '{',
  ']': '}',
  ',': '<',
  '.': '>',
  '/': '?',
  '\\': '|'
};
var _drawModes = ['clear', 'polygon', 'polyline', 'line', 'arrow', 'rectangle', 'circle', 'ellipse', 'cubic', 'quadratic', 'draw', 'text', 'MOVE']; // TODO: Fix shift text GROUP <tspan>?; Entry points for Arrow attributes, color setting

function SVGDraw(containerID) {
  // container:<svgLayer>:<xlt>:<svgImage>
  svgImage = new Image();
  thisSVGpoints = []; // collect points as [x,y]

  textHeight = 75;
  textFont = 'Verdana';
  savedCursorMode = cursorMode;
  var cWidth = parseInt(containerID.attributes['data-width'].value); // this seems too explicit

  var cHeight = parseInt(containerID.attributes['data-height'].value); // shouldn't this be inherited from parent?

  svgImage.src = containerID.attributes['data-image'].value;
  var self = this; ////////////// prior "this" usages below converted to "self" through end of svgImage.onload fn

  svgImage.onload = function (event) {
    svgOffset = {
      top: containerID.offsetTop,
      // .split('px')[0],
      left: containerID.offsetLeft // .split('px')[0]

    }; //indicateMode(cursorMode);

    xC = 0;
    yC = 0;
    var cAR = cWidth / cHeight;
    var iAR = svgImage.width / svgImage.height;
    svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttributeNS(null, 'id', 'svgLayer');
    svgLayer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgLayer.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgLayer.setAttributeNS(null, 'version', '1.1');
    svgLayer.setAttributeNS(null, 'style', 'position: inherit;');
    svgLayer.setAttributeNS(null, 'width', cWidth);
    svgLayer.setAttributeNS(null, 'height', cHeight);
    containerID.appendChild(svgLayer); // scale to height if (similar aspect ratios AND image aspect ratio less than container's)
    // OR the image is tall and the container is wide)

    if ((cAR >= 1 && iAR >= 1 || cAR <= 1 && iAR <= 1) && iAR <= cAR || iAR <= 1 && cAR >= 1) {
      baseZoom = svgLayer.height.baseVal.value / svgImage.height; // scale to height on condition desc in comment
    } else {
      baseZoom = svgLayer.width.baseVal.value / svgImage.width; // otherwise scale to width
    }

    zoom = baseZoom; // at initialization

    strokeWidth = (baseStrokeWidth / zoom).toString(); // dynamically recomputed with zoom (not this one)

    bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)

    lastMouseX = baseZoom * svgImage.width / 2; // center of image

    lastMouseY = baseZoom * svgImage.height / 2; // insert the svg base image into the transformable group <g id='xlt'>

    var xlt = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xlt.setAttributeNS(null, 'id', 'xlt');
    xlt.setAttributeNS(null, 'transform', 'translate(0,0)scale(' + parseFloat(zoom) + ')');
    svgLayer.appendChild(xlt);
    var xltImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    xltImage.setAttributeNS(null, 'id', "xltImage");
    xltImage.setAttributeNS(null, 'x', "0");
    xltImage.setAttributeNS(null, 'y', "0");
    xltImage.setAttributeNS(null, 'width', svgImage.width.toString());
    xltImage.setAttributeNS(null, 'height', svgImage.height.toString());
    xltImage.setAttributeNS(null, 'preserveAspectRatio', "none");
    xltImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgImage.src);
    xlt.appendChild(xltImage);
    SVGDraw.prototype.buildSVGmenu(containerID); // populate the button-ology from the data element description (mostly)

    document.onkeydown = self.keyHandler(); /////////////// This is probably tooo broad   /////////////////

    document.onkeyup = self.keyUpHandler(); //Mousetrap.bind('enter', self.doubleClickHandler());     // invokes handler vs handler's returned function

    zoom_trans(0, 0, zoom); //////////// IMPORTANT !!!!!!!!!!!

    setCursorMode('MOVE');
    self.renderFunction = self.updateSvgByElement; //self.touchSupported = Modernizr.touch;

    self.touchSupported = 'ontouchstart' in document.documentElement; // thanks, Edd Turtle !

    self.containerID = containerID;
    self.lastMousePoint = {
      x: 0,
      y: 0
    };

    if (self.touchSupported) {
      self.mouseDownEvent = "touchstart";
      self.mouseMoveEvent = "touchmove";
      self.mouseUpEvent = "touchend";
    } else {
      self.mouseDownEvent = "mousedown";
      self.mouseMoveEvent = "mousemove";
      self.mouseUpEvent = "mouseup";
      svgLayer.ondblclick = self.doubleClickHandler(); // replace jquery reference
      // svgLayer.onwheel = self.mouseWheelScrollHandler();        // replace jquery reference
      /////////////////// TEMPORARILY SUPPRESS WHEEL SCROLL
    }

    svgLayer.onmousedown = self.onSvgMouseDown(); // replace jquery reference

    self.mouseMoveHandler = self.onSvgMouseMove;
    self.mouseUpHandler = self.onSvgMouseUp;
    svgLayer.onmouseup = self.mouseUpHandler(); // replace jquery reference

    svgLayer.onmousemove = self.mouseMoveHandler(); // replace jquery reference
  };
}

SVGDraw.prototype.onSvgMouseDown = function () {
  // in general, start or stop element generation on mouseDOWN (true?)
  // BUT for PATH, line and MOVE, stop on mouseUP
  var self = this;
  return function (event) {
    self.updateMousePosition(event);

    if (svgInProgress != false && svgInProgress != cursorMode) {
      // terminate in progress svg before continuing
      if (svgInProgress == 'SHIFT') {
        return; //  ///////// should these be returning false?
      } else {
        svgInProgress = cursorMode; //  ??

        return;
      }
    }

    if (thisGroup) {
      if (thisGroup.childElementCount > 1 && cursorMode != 'text') {
        // this is the case where there is a click on a mouseovered
        // thisGroup.lastChild.remove();
        clearEditElement(thisGroup); // setCursorMode(savedCursorMode);       // because we know specifically that we mouseentered an element

        return false;
      }
    }

    if (cursorMode == 'polygon') {
      // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        var newGroupID = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group.setAttributeNS(null, 'id', newGroupID);

        _group.setAttributeNS(null, 'class', cursorMode);

        thisGroup = _group;
        document.getElementById("xlt").appendChild(_group);
        var element = createElement('polyline'); //YES, I KNOW... polyline behavior mimics google maps better

        _group.appendChild(element);

        thisElement = _group.children[0];
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(3).toString() + ',' + thisSVGpoints[0][1].toFixed(3).toString() + ' ' + thisSVGpoints[0][0].toFixed(3).toString() + ',' + thisSVGpoints[0][1].toFixed(3).toString() + ' '); // start x,y for both points initially

        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        var thesePoints = thisElement.attributes['points'].value; // to trim or not to trim?  if so, multiple implications here

        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }

    if (cursorMode == 'polyline') {
      // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group2;

        var _newGroupID = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group2.setAttributeNS(null, 'id', _newGroupID);

        _group2.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group2);

        var _element = createElement('polyline');

        _group2.appendChild(_element);

        thisElement = _group2.children[0];

        _element.setAttributeNS(null, 'stroke-linecap', 'round');

        _element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(3).toString() + ',' + thisSVGpoints[0][1].toFixed(3).toString() + ' ' + thisSVGpoints[0][0].toFixed(3).toString() + ',' + thisSVGpoints[0][1].toFixed(3).toString() + ' '); // start x,y for both points initially


        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        var _thesePoints = thisElement.attributes['points'].value;

        var _thisPoint = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString() + ' ';

        thisElement.attributes['points'].value = _thesePoints.concat(_thisPoint);
      }
    }

    if (cursorMode == 'rect') {
      // mouseDown starts creation, after drag, mouseUp ends
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group3 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        var _newGroupID2 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group3.setAttributeNS(null, 'id', _newGroupID2);

        _group3.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group3);

        var _element2 = createElement('rect');

        _group3.appendChild(_element2);

        thisGroup = _group3;
        thisElement = _group3.children[0];

        _element2.setAttributeNS(null, 'x', thisSVGpoints[0][0]); // start x


        _element2.setAttributeNS(null, 'y', thisSVGpoints[0][1]); // start y


        _element2.setAttributeNS(null, 'width', 1); // width x


        _element2.setAttributeNS(null, 'height', 1); // height y


        svgInProgress = cursorMode; // mark in progress
      } // now using mouseUp event to terminate rect

    }

    if (cursorMode == 'line') {
      //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group4 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group4;

        var _newGroupID3 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group4.setAttributeNS(null, 'id', _newGroupID3);

        _group4.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group4);

        var _element3 = createElement('line');

        _group4.appendChild(_element3);

        thisElement = _group4.children[0];

        _element3.setAttributeNS(null, 'x1', thisSVGpoints[0][0]); // start x


        _element3.setAttributeNS(null, 'y1', thisSVGpoints[0][1]); // start y


        _element3.setAttributeNS(null, 'x2', thisSVGpoints[0][0]); // end x


        _element3.setAttributeNS(null, 'y2', thisSVGpoints[0][1]); // end y


        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement); // unbindMouseHandlers(self);
      }
    }

    if (cursorMode == 'arrow') {
      //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group5 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group5;

        var _newGroupID4 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group5.setAttributeNS(null, 'id', _newGroupID4);

        _group5.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group5);

        var _element4 = createElement('line');

        _group5.appendChild(_element4);

        thisElement = _group5.children[0];

        _element4.setAttributeNS(null, 'x1', thisSVGpoints[0][0]); // start x


        _element4.setAttributeNS(null, 'y1', thisSVGpoints[0][1]); // start y


        _element4.setAttributeNS(null, 'x2', thisSVGpoints[0][0]); // end x


        _element4.setAttributeNS(null, 'y2', thisSVGpoints[0][1]); // end y


        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement); // unbindMouseHandlers(self);
      }
    }

    if (cursorMode == 'circle') {
      // mouseDown    // modified to use common element for handlers
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        if (thisGroup != null) {
          //  ////////////// ???
          clearEditElement(thisGroup); // this group is the one with bubbles, to be obviated
        }

        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group6 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        var _newGroupID5 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group6.setAttributeNS(null, 'id', _newGroupID5);

        _group6.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group6);

        var _element5 = createElement(cursorMode); // new generalized method


        _group6.appendChild(_element5);

        thisGroup = _group6;
        thisElement = _group6.children[0]; // this var is used to dynamically create the element

        _element5.setAttributeNS(null, 'cx', thisSVGpoints[0][0]); // start x


        _element5.setAttributeNS(null, 'cy', thisSVGpoints[0][1]); // start y


        _element5.setAttributeNS(null, 'r', 1); // width x


        svgInProgress = cursorMode; // mark in progress
      } // now using mouseup event exclusively to terminate circle

    }

    if (cursorMode == 'ellipse') {
      // mouseDown
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group7 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group7;

        var _newGroupID6 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group7.setAttributeNS(null, 'id', _newGroupID6);

        _group7.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group7);

        var _element6 = createElement('ellipse');

        _group7.appendChild(_element6);

        thisElement = _group7.children[0];

        _element6.setAttributeNS(null, 'cx', thisSVGpoints[0][0]); // start x


        _element6.setAttributeNS(null, 'cy', thisSVGpoints[0][1]); // start y


        _element6.setAttributeNS(null, 'rx', 1); // radius x


        _element6.setAttributeNS(null, 'ry', 1); // radius y


        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement); // unbindMouseHandlers(self);
      }
    }

    if (cursorMode == 'draw') {
      // mouseDown
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group8 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group8;

        var _newGroupID7 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group8.setAttributeNS(null, 'id', _newGroupID7);

        _group8.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group8); //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one

        var _element7 = createElement('polyline');

        _group8.appendChild(_element7);

        thisElement = _group8.children[0];

        _element7.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(3).toString() + ',' + thisSVGpoints[0][1].toFixed(3).toString() + ' '); // start x,y
        //}


        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisElement); // unbindMouseHandlers(self);
      }
    }

    if (cursorMode == 'cubic' || cursorMode == 'quadratic') {
      // mouseDown
      // The cubic Bezier curve requires non-symbolic integer values for its path parameters.
      // This will necessitate the dynamic reconstruction of the "d" attribute using parseInt
      // on each value.  The edit sister group will have 4 bubbles, ids: p1, c1, c2, p2 to decode
      // the control points' mousemove action.  Make control points the same as the endpoints initially,
      // then annotate with bubbles to shape the curve.  This is an extra step more than other elements.
      if (svgInProgress == false) {
        // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];

        var _group9 = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        thisGroup = _group9;

        var _newGroupID8 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group9.setAttributeNS(null, 'id', _newGroupID8);

        _group9.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group9);

        var _element8 = createElement('path');

        _group9.appendChild(_element8);

        thisElement = _group9.children[0];
        var thisX = thisSVGpoints[0][0];
        var thisY = thisSVGpoints[0][1];

        _element8.setAttributeNS(null, 'd', getCurvePath(thisX, thisY, thisX, thisY, thisX, thisY, thisX, thisY));

        svgInProgress = cursorMode; // mark in progress
      } else {
        // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement); // unbindMouseHandlers(self);
      }
    }

    if (cursorMode == "text") {
      // mouseDown - could be initial click, revised position click, or preemie
      var _group10;

      if (thisElement) {
        finishTextGroup();
      }

      if (svgInProgress == false) {
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        savedCursorMode = cursorMode; // plant this to prevent immediate post-creation clearing

        _group10 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = _group10;

        var _newGroupID9 = 'g' + document.getElementById("xlt").childElementCount.toString();

        _group10.setAttributeNS(null, 'id', _newGroupID9);

        _group10.setAttributeNS(null, 'class', cursorMode);

        document.getElementById("xlt").appendChild(_group10); //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one

        var _element9;

        _element9 = document.createElementNS('http://www.w3.org/2000/svg', 'text'); //document.getElementById(group.id).appendChild(element);

        _group10.appendChild(_element9); // thisSVGpointsText = group.children[0];


        thisElement = _group10.children[0];

        _element9.setAttributeNS(null, 'stroke', cursorColor);

        _element9.setAttributeNS(null, 'stroke-width', '1');

        _element9.setAttributeNS(null, 'stroke-opacity', '1.0');

        _element9.setAttributeNS(null, 'x', thisSVGpoints[0][0]); // start x


        _element9.setAttributeNS(null, 'y', thisSVGpoints[0][1]); // start y


        _element9.setAttributeNS(null, 'style', 'font-family: ' + textFont + '; fill: ' + cursorColor.toString() + ';');

        _element9.setAttributeNS(null, 'font-size', textHeight);

        _element9.innerHTML = '_'; // plant the text cursor   /////////////////

        svgInProgress = 'text'; // mark in progress
      }
    }

    if (cursorMode == 'MOVE') {
      // mouseDown
      if (svgInProgress == false) {
        svgInProgress = cursorMode;
      }
    }

    waitElement = false; //    ///////////   new code to allow creation start within extant element

    return event.preventDefault() && false;
  };
};

function pathPoint(x, y) {
  return parseInt(x) + ", " + parseInt(y);
}

function curvePoint(x, y) {
  return pathPoint(x, y) + ", ";
}

function getCurvePath(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (cursorMode == 'cubic') {
    return "M " + pathPoint(x1, y1) + " C " + curvePoint(cx1, cy1) + curvePoint(cx2, cy2) + pathPoint(x2, y2);
  } else return "M " + pathPoint(x1, y1) + " Q " + curvePoint(cx1, cy1) + pathPoint(x2, y2);
}

function getCurveCoords(d) {
  var pieces = d.replace(/,/g, '').split(' ');
  var j = 0;
  var coords = [];

  for (var k = 0; k < pieces.length; k++) {
    if (isNumeric(pieces[k])) {
      // bypass the curve type symbol
      coords[j] = pieces[k];
      j++;
    }
  }

  return coords;
}

function getCurvePoints(coords) {
  // special bounding poly for curve element
  return curvePoint(coords[0], coords[1]) + ' ' + curvePoint(coords[2], coords[3]) + ' ' + curvePoint(coords[4], coords[5]) + ' ' + curvePoint(coords[6], coords[7]);
}

function createElement(klass) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', klass);
  element.setAttributeNS(null, 'stroke', cursorColor);
  element.setAttributeNS(null, 'stroke-width', strokeWidth);
  element.setAttributeNS(null, 'stroke-opacity', '0.9');
  element.setAttributeNS(null, 'fill', '');
  element.setAttributeNS(null, 'fill-opacity', '0.0');
  element.setAttributeNS(null, 'stroke-linecap', 'round');
  return element;
}

function setMouseoverOut(element) {
  element.setAttributeNS(null, 'onmouseover', "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "';");
  element.setAttributeNS(null, 'onmouseout', "this.attributes['stroke-width'].value = " + strokeWidth + ";");
  return element;
}

function mouseEnterFunction(event) {
  var thisGroupID = thisGroup ? thisGroup.id : 'null';
  var thisElementTagName = thisElement ? thisElement.tagName : 'null';
  var thisElementParent = thisElement ? thisElement.parentElement.id : 'null';
  console.log("mouseenter" + ' eventTarget=' + event.target.id + ' thisGroup=' + thisGroupID + ' thisElement=' + thisElementTagName + ' parent=' + thisElementParent + ' ' + cursorMode + ' ');
  setEditElement(event.target);
}

function mouseLeaveFunction(event) {
  var thisGroupID = thisGroup ? thisGroup.id : 'null';
  var thisElementTagName = thisElement ? thisElement.tagName : 'null';
  var thisElementParent = thisElement ? thisElement.parentElement.id : 'null';
  console.log("mouseleave" + ' eventTarget=' + event.target.id + ' thisGroup=' + thisGroupID + ' thisElement=' + thisElementTagName + ' parent=' + thisElementParent + ' ' + cursorMode + ' ');
  clearEditElement(event.target);
}

function setElementMouseEnterLeave(group) {
  // this actually sets the parent group's listeners
  if (group == null || group == undefined) {
    group = null; //  debug catch point
  }

  group.removeEventListener('mouseenter', mouseEnterFunction);
  group.removeEventListener('mouseleave', mouseLeaveFunction);
  group.addEventListener('mouseenter', mouseEnterFunction);
  group.addEventListener('mouseleave', mouseLeaveFunction);
  return group;
}

function setEditElement(group) {
  // add bubble elements to the group containing this element
  if (checkElementConflict(group)) {
    // returns true if conflict
    console.log('Element conflict: ' + group.attributes.class.value);
    return;
  }

  console.log('setEditElement no conflict');

  if (thisGroup == null) {
    // no conflicts detected, so if thisGroup is null,
    var msg = 'thisGroup is NULL';

    if (thisElement) {
      msg += ', thisElement = ' + thisElement.toString();
    }

    ;
    console.log(group.attributes.class.value + ' ' + msg);
    thisGroup = group; // there is probably no creation activity
  } //if (group.firstChild.tagName != cursorMode) {    // start editing an element not in the current mode


  savedCursorMode = cursorMode; // don't wait for actual action on bubble

  if (group.firstChild) {
    if (group.firstChild.tagName != 'path') {
      if (group.attributes.class) {
        // class atribute existence
        cursorMode = group.attributes.class.value;
      } else {
        cursorMode = group.firstChild.tagName;
      }
    } else {
      // now that there are both cubic and quadratic curves, we must detect this one's class
      cursorMode = 'cubic'; // ///////// finesse path

      if (group.firstChild.attributes.d.value.indexOf('C ') == -1) {
        // is the path quadratic because it's not cubic?
        cursorMode = 'quadratic';
      }
    }
  }

  svgInProgress = false; //  ////////// we have set bubbles but no action taken yet

  indicateMode(cursorMode); //}

  if (group.childNodes.length > 1) {
    // do I have bubbles? possibly? (might be text)
    if (group.lastChild.tagName == 'g') {
      // group.lastChild.remove();         // this is the group of bubbles
      clearEditElement(group);
    }
  }

  var bubbleGroup = createBubbleGroup(group); // since bubble groups are heterogeneous in structure

  group.appendChild(bubbleGroup); // make the new bubble group in a no-id <g>

  console.log('setEditElement ' + group.id + ' ' + group.attributes.class.value); // group.removeEventListener('mouseleave', mouseLeaveFunction)
}

function clearEditElement(group) {
  // given containing group; invoked by mouseleave, so order of statements reordered
  var thisGroupID = thisGroup ? thisGroup.id : 'null';
  console.log('clearEditElement: svgInProgress=' + svgInProgress + ', group=' + group.id + ', thisGroup=' + thisGroupID);

  if (svgInProgress == 'SHIFT') {
    // if we are shifting an element, do nothing
    return;
  }

  if (!group) {
    // if we are misassociated just back away . . .
    console.log('clearEditElement: group argument null');
    return;
  }

  if (waitElement) {
    console.log('clearEditElement: waitElement');
    return;
  }

  if (thisGroup && thisGroupID != group.id) {
    // collision
    console.log('clearEditElement: group conflict');
    return;
  }

  if (group.childNodes.length > 1) {
    // do I have bubbles? i.e., is there more than just the golden chile?
    if (group.lastChild.tagName == 'circle' || group.lastChild.tagName == 'g') {
      // poly- bubbles have a child group
      group.lastChild.remove(); // this is the group of bubbles (and maybe nested ones) if not just a SHIFT bubble

      thisBubble = null;
      cursorMode = 'MOVE'; // was savedCursorMode;   // on exit of edit mode, restore

      indicateMode(cursorMode);
      svgInProgress = false;
      thisElement = null;
      thisGroup = null;
    } else {
      if (group.firstChild.tagName == 'text') {
        if (svgInProgress == 'text') {
          finishTextGroup();
        }
      }
    }
  } //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element


  setElementMouseEnterLeave(group);
  cursorMode = 'MOVE'; // was savedCursorMode;   // on exit of edit mode, restore

  indicateMode(cursorMode);
  svgInProgress = false;
  thisElement = null;
  thisGroup = null; //  eliminated savedCursorMode = 'MOVE';
}

function checkElementConflict(group) {
  // only invoked by mouseenter listeners

  /* consider potential values of:
   svgInProgress, one of the svg modes, plus move, shift, and size
   cursorMode, the selected (if not always indicated) creation / editing mode
   thisElement, nominally the active element - conflict with bubbles
   thisGroup, nominally the group of the active element
   */
  if (waitElement) {
    console.log('checkElementConflict1: waitElement = ' + waitElement);
    return true;
  }

  if (!svgInProgress) {
    console.log('checkElementConflict2: svgInProgress=' + svgInProgress + 'thisGroup=' + group.id);
    return false; // if no active element
  }

  if (svgInProgress == 'SHIFT') {
    console.log('checkElementConflict3: svgInProgress=' + svgInProgress + 'thisGroup=' + group.id);

    if (thisGroup.id != group.id) {
      return true;
    } else {
      return false;
    }
  }

  if (svgInProgress != group.firstChild.tagName) {
    console.log('checkElementConflict4: svgInProgress=' + svgInProgress + ', thisElement=' + thisElement + ', group element=' + group.firstChild.tagName);
    return true; //  if we crossed another element
  }

  if (thisGroup != group) {
    console.log('checkElementConflict5: svgInProgress=' + svgInProgress + ', thisGroup=' + thisGroup.id + ', group=' + group.id + ', group element=' + group.firstChild.tagName);
    return true;
  }
}

function exitEditPoint(group) {
  // services mouseUp from SIZE/point bubble
  // reset all bubbles for this element
  if (group == null) {
    console.log('fault');
  }

  while (group.childElementCount > 1 && group.lastChild.tagName == 'g') {
    // changed from group.childElementCount > 1
    group.lastChild.remove(); // eliminates all bubbles
  }

  svgInProgress = false; ///////////////

  thisBubble = null; //cursorMode = "MOVE";  //was savedCursorMode; ////////////// actually editing element unchains creation of this class

  setCursorMode("MOVE");
  setElementMouseEnterLeave(group);
}

function setShiftElement(bubble) {
  // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  if (!thisGroup) {
    thisGroup = bubble.parentNode.parentNode; // set group for mousemove
  }

  thisElement = thisGroup.firstChild; // thisBubble = group.lastChild.firstChild;      // this is the center/first bubble

  thisBubble = thisGroup.children[1].children['shift']; // this is the center/first bubble

  cursorMode = thisElement.tagName;

  if (thisGroup.attributes.class) {
    cursorMode = thisGroup.attributes.class.value;
  } //// presumption of ordering of shift bubble vs other bubbles: FIRST bubble is shift -- modified other code so TRUE


  var endK = thisGroup.lastChild.childElementCount; // total bubbles, leave the first one

  for (var k = endK; k > 1; k--) {
    thisGroup.lastChild.lastChild.remove(); // remove resize bubbles from the end
  }

  thisGroup.removeEventListener('mouseenter', mouseEnterFunction);
  thisGroup.removeEventListener('mouseleave', mouseLeaveFunction);
  svgInProgress = 'SHIFT';
  console.log('svgInProgress = SHIFT, cursorMode = ' + cursorMode);
}

function setSizeElement(bubble) {
  // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  var group = bubble.parentNode.parentNode; // set group for mousemove

  thisGroup = group; // set group for mousemove

  thisElement = group.firstChild;
  thisBubble = group.lastChild.firstChild; // this is the center/first bubble

  cursorMode = thisElement.tagName;

  if (cursorMode == 'circle' || cursorMode == 'ellipse') {
    var endK = group.lastChild.childElementCount; // total bubbles, leave the first one (thisElement)

    for (var k = endK; k > 0; k--) {
      group.lastChild.lastChild.remove(); // remove resize bubbles from the end
    }
  }

  svgInProgress = 'SIZE';
  console.log('svgInProgress = SIZE, cursorMode = ' + cursorMode + ' ' + thisElement.tagName);
  group.removeEventListener('mouseenter', mouseEnterFunction);
  group.removeEventListener('mouseleave', mouseLeaveFunction);
}

function setPointElement(bubble) {
  // this performs the inline substitution of the selected bubble coordinates
  if (thisBubble == bubble) {// this condition implies we mouseDowned on the point we are changing
    // breakpoint convenience point
  }

  thisBubble = bubble;
  var group = bubble.parentNode.parentNode; // set group for mousemove

  thisGroup = group;
  thisElement = group.firstChild; // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    // last point/bubble?
    thisBubble = bubble;
  }

  if (bubble.parentNode.lastChild.tagName == 'g') {
    bubble.parentNode.lastChild.remove(); // /////////// this is the right place: remove insert point bubbles
  }

  if (thisGroup.attributes.class) {
    cursorMode = thisGroup.attributes.class.value;
  } else {
    cursorMode = thisElement.tagName;
  }

  group.removeEventListener('mouseenter', mouseEnterFunction);
  group.removeEventListener('mouseleave', mouseLeaveFunction); // bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown

  bubble.removeEventListener('mousedown', function (event) {});
  svgInProgress = 'POINT'; // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
} // use mouseup or mousedown to terminate radius drag


function setNewPointElement(bubble) {
  // this inserts the new point into the <poly.. element
  if (thisBubble == bubble) {
    // this condition implies we mouseDowned on the point we are INSERTING
    var BreakHere = true; // /////////  VERY PRELIM
  }

  thisBubble = bubble;
  var group = bubble.parentNode.parentNode.parentNode; // set group for mousemove handler

  thisGroup = group;
  thisElement = group.firstChild; // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    thisBubble = bubble;
  }

  cursorMode = thisElement.tagName;
  group.removeEventListener('mouseenter', mouseEnterFunction); // disable mouseover on real element's containing group

  group.removeEventListener('mouseleave', mouseLeaveFunction); // disable mouseleaver on real element's containing group
  // bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown

  thisElement.attributes['points'].value = insertNewPoint(thisElement, thisBubble);
  thisBubble.id = (parseInt(thisBubble.id) + 1).toString(); // ///////// seems to work, but...

  svgInProgress = 'NEW'; // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
} // use mouseup or mousedown to terminate radius drag


function insertNewPoint(element, bubble) {
  //this bubble's ID truncated is the point to insert AFTER
  var splitPoints = element.attributes['points'].value.trim().split(' ');
  var thesePoints = '';
  var insertionPoint = parseInt(bubble.id);
  var thisPoint = bubble.attributes['cx'].value + ',' + bubble.attributes['cy'].value;

  for (var k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' ';

    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }

  return thesePoints;
}

function createBubbleGroup(group) {
  var svgAttrs = {};
  var thisX;
  var thisY;
  var splitPoints;
  var nextX;
  var nextY;

  if (!group) {
    console.log('group arg null, thisGroup=' + thisGroup);
  }

  var element = group.firstChild;
  svgAttrs = getModel(element.tagName);

  if (element.tagName != 'path') {
    // /////// skip this step for path exception
    for (var key in svgAttrs) {
      // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key); // collect this numeric attribute
    }
  }

  var bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g'); // var bubble;

  switch (element.tagName) {
    case 'circle':
      // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var cr = svgAttrs['r'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift')); // this is the center point of both bubble and circle

      bubbleGroup.appendChild(createSizeBubble(cr + cx, cy, 'E')); // this is the E resize point

      bubbleGroup.appendChild(createSizeBubble(cx, cr + cy, 'S')); // this is the S resize point

      bubbleGroup.appendChild(createSizeBubble(cx - cr, cy, 'W')); // this is the W resize point

      bubbleGroup.appendChild(createSizeBubble(cx, cy - cr, 'N')); // this is the N resize point

      return bubbleGroup;

    case 'ellipse':
      // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      cx = svgAttrs['cx'];
      cy = svgAttrs['cy'];
      var rx = svgAttrs['rx'];
      var ry = svgAttrs['ry'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift')); // this is the center point of both bubble and circle

      bubbleGroup.appendChild(createSizeBubble(cx + rx * 0.707, cy + ry * 0.707, 'SE')); // this is the SE resize point

      bubbleGroup.appendChild(createSizeBubble(cx + rx * 0.707, cy - ry * 0.707, 'NE')); // this is the NE resize point

      bubbleGroup.appendChild(createSizeBubble(cx - rx * 0.707, cy - ry * 0.707, 'NW')); // this is the NW resize point

      bubbleGroup.appendChild(createSizeBubble(cx - rx * 0.707, cy + ry * 0.707, 'SW')); // this is the SW resize point

      return bubbleGroup;

    case 'rect':
      var x = svgAttrs['x'];
      var y = svgAttrs['y'];
      var w = svgAttrs['width'];
      var h = svgAttrs['height'];
      bubbleGroup.appendChild(createShiftBubble(x, y, 'shift')); // this is the rectangle origin, anomalous as it may be

      bubbleGroup.appendChild(createSizeBubble(x + w, y + h)); // this is the resize point

      return bubbleGroup;

    case 'line':
      var x1 = svgAttrs['x1'];
      var y1 = svgAttrs['y1'];
      var x2 = svgAttrs['x2'];
      var y2 = svgAttrs['y2'];
      bubbleGroup.appendChild(createShiftBubble((x2 + x1) / 2, (y2 + y1) / 2, 'shift')); // this is the move line point

      bubbleGroup.appendChild(createPointBubble(x1, y1, 'x1-y1')); // this is the 1st line coordinate

      bubbleGroup.appendChild(createPointBubble(x2, y2, 'x2-y2')); // this is the 2nd (terminal) line point

      return bubbleGroup;

    case 'path':
      // this is a MAJOR EXCEPTION to the other cases, used for curve !! articulate for type !!
      var theseCurvePoints = element.attributes['d'].value;
      var thisCurveTypeQuadratic = theseCurvePoints.indexOf('Q ') > 0;
      var theseCoords = getCurveCoords(theseCurvePoints); // stack control points after end points after helpers
      // fill out both control points in either case

      if (thisCurveTypeQuadratic) {
        // if quadratic
        theseCoords[6] = theseCoords[4]; // replicate p2

        theseCoords[7] = theseCoords[5]; // into last coord set

        theseCoords[4] = theseCoords[2]; // for both control points

        theseCoords[5] = theseCoords[3]; // for control lines
      } // calculate centroid for shift bubble


      var xn, yn;

      if (thisCurveTypeQuadratic) {
        xn = parseFloat(theseCoords[0]) + parseFloat(theseCoords[2]) + parseFloat(theseCoords[6]);
        yn = parseFloat(theseCoords[1]) + parseFloat(theseCoords[3]) + parseFloat(theseCoords[7]);
        xn = (xn / 3).toFixed(3);
        yn = (yn / 3).toFixed(3); // this calculation is less wrong for quadratic ...
      } else {
        xn = parseFloat(theseCoords[0]) + parseFloat(theseCoords[2]) + parseFloat(theseCoords[4]) + parseFloat(theseCoords[6]);
        yn = parseFloat(theseCoords[1]) + parseFloat(theseCoords[3]) + parseFloat(theseCoords[5]) + parseFloat(theseCoords[7]);
        xn = (xn / 4).toFixed(3);
        yn = (yn / 4).toFixed(3);
      } // create the "bounding" polygon  'poly'


      bubbleGroup.appendChild(createBoundsPoly(theseCoords));
      bubbleGroup.appendChild(createShiftBubble(xn, yn, 'shift')); // this is the move element bubble
      // create the lines between the control point(s) and the endpoints

      bubbleGroup.appendChild(createControlLine(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], 'l1'));
      bubbleGroup.appendChild(createControlLine(theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7], 'l2'));
      bubbleGroup.appendChild(createCurveBubble(theseCoords[0], theseCoords[1], 'p1')); // first endpoint

      bubbleGroup.appendChild(createCurveBubble(theseCoords[6], theseCoords[7], 'p2')); // second endpoint

      bubbleGroup.appendChild(createCurveBubble(theseCoords[2], theseCoords[3], 'c1')); // first control point

      if (!thisCurveTypeQuadratic) {
        bubbleGroup.appendChild(createCurveBubble(theseCoords[4], theseCoords[5], 'c2')); // second control point
      }

      return bubbleGroup;

    case 'polygon':
    case 'polyline':
      // create a parallel structure to the point attr, using its coords
      var thesePoints = element.attributes['points'].value.trim(); // trim to eliminate extraneous empty string

      splitPoints = thesePoints.split(' ');
      var thisPoint = splitPoints[0].split(','); // prime the pump for iteration

      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);
      var xAve = 0;
      var yAve = 0;
      var nextPoint; // nextX,nextY these are used to bound and calculate the intermediate

      for (var k = 0; k < splitPoints.length; k++) {
        // append this point and an intermediary point
        xAve += thisX; // simple computation

        yAve += thisY; // of center-ish point

        if (k < splitPoints.length - 1) {
          // since we are looking ahead one point
          nextPoint = splitPoints[k + 1].split(','); // only add intermediate point if we are not at the last point

          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          thisX = nextX;
          thisY = nextY;
        }
      }

      thisX = xAve / splitPoints.length;
      thisY = yAve / splitPoints.length;
      bubbleGroup.appendChild(createShiftBubble(thisX, thisY, 'shift')); // insert new point bubbles in separate parallel group

      var newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);

      for (var _k = 0; _k < splitPoints.length; _k++) {
        // append this point and an intermediary point
        //thisPoint  = splitPoints[k].split(',');
        bubbleGroup.appendChild(createPointBubble(thisX, thisY, _k.toString())); // add the vertex point

        if (_k < splitPoints.length - 1) {
          // since we are looking ahead one point
          nextPoint = splitPoints[_k + 1].split(','); // only add intermediate point if we are not at the last point

          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), _k.toString() + '.5')); // ///////// watch for hierarchicial misplacement

          thisX = nextX;
          thisY = nextY;
        }
      }

      if (element.tagName == 'polygon') {
        // additional step for polygon, since there is an implicit closure
        thisPoint = splitPoints[0].split(','); // get the first point again

        thisX = parseFloat(thisPoint[0]);
        thisY = parseFloat(thisPoint[1]);
        var thisID = (splitPoints.length - 1).toString() + '.5';
        newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), thisID));
      }

      bubbleGroup.appendChild(newBubbleGroup); // add the new point insertion bubbles

      return bubbleGroup;

    case 'text':
      thisX = svgAttrs['x'];
      thisY = svgAttrs['y'];
      bubbleGroup.appendChild(createShiftBubble(thisX, thisY, 'shift'));
      return bubbleGroup;
  }
}

function createShiftBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 1.25); // radius override for SHIFT point

  bubble.setAttributeNS(null, 'stroke', '#004477'); // override scaffold attrs

  bubble.setAttributeNS(null, 'fill-opacity', '1.0'); // SHIFT bubble is slightly more opaque

  bubble.addEventListener('mousedown', function (event) {
    setShiftElement(bubble);
  });
  bubble.addEventListener('mouseup', function (event) {
    setElementMouseEnterLeave(bubble);
  });
  bubble.setAttributeNS(null, 'style', 'cursor:move;');
  bubble.setAttributeNS(null, 'id', id); // use this identifier to attach cursor in onSvgMouseMove

  return bubble;
}

function createSizeBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6'); // SIZE/POINT bubble is slightly less opaque

  bubble.addEventListener('mousedown', function (event) {
    setSizeElement(bubble);
  }); // bubble.addEventListener('mouseup', (event) => { setElementMouseEnterLeave(bubble) });

  bubble.setAttributeNS(null, 'id', id); // use this identifier to attach cursor in onSvgMouseMove

  return bubble;
}

function createPointBubble(cx, cy, id) {
  // used for <poly...> vertices
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6'); // SIZE/POINT bubble is slightly less opaque

  bubble.setAttributeNS(null, 'id', id); // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: 'x1-y1', 'x2-y2' for <line>,
  // will take the form: '0', '13' for <poly-...>

  bubble.addEventListener('mousedown', function (event) {
    setPointElement(bubble);
  });
  bubble.addEventListener('mouseup', function (event) {
    exitEditPoint(thisGroup);
  });
  return bubble;
}

function createNewPointBubble(cx, cy, id) {
  // used for <poly...> inter-vertex insert new point
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8); // radius override for insertion point

  bubble.setAttributeNS(null, 'stroke', '#555555'); // not that great, use below

  bubble.setAttributeNS(null, 'stroke-opacity', '0.6'); // not that great, use below

  bubble.setAttributeNS(null, 'fill-opacity', '0.4'); // SIZE/POINT bubble is even less opaque

  bubble.addEventListener('mousedown', function (event) {
    setNewPointElement(bubble);
  });
  bubble.addEventListener('mouseup', function (event) {
    exitEditPoint(thisGroup);
  });
  bubble.setAttributeNS(null, 'id', id); // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: '0.5', '23.5' for <poly-...>

  return bubble;
}

function createCurveBubble(cx, cy, id) {
  // used for <path...> inter-vertex control point
  var bubble = createBubbleStub(cx, cy); // bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for control point

  bubble.setAttributeNS(null, 'stroke', '#333333'); // not that great, use below

  bubble.setAttributeNS(null, 'stroke-opacity', '0.6'); // not that great, use below

  bubble.setAttributeNS(null, 'fill-opacity', '0.8'); // make these stand out

  bubble.addEventListener('mousedown', function (event) {
    setPointElement(bubble);
  });
  bubble.addEventListener('mouseup', function (event) {
    exitEditPoint(event.target.parentElement.parentElement);
  });
  bubble.setAttributeNS(null, 'id', id); // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: 'c1', 'c2' for <path-...>

  return bubble;
}

function createControlLine(x1, y1, x2, y2, id) {
  var line = createElement('line');
  line.setAttributeNS(null, 'x1', x1);
  line.setAttributeNS(null, 'y1', y1);
  line.setAttributeNS(null, 'x2', x2);
  line.setAttributeNS(null, 'y2', y2);
  line.setAttributeNS(null, 'id', id);
  line.setAttributeNS(null, 'stroke-width', '1');
  return line;
}

function createBoundsPoly(coords) {
  // used by createBubbleGroup.path
  var poly = createElement('polyline');
  poly.setAttributeNS(null, 'id', 'poly');
  poly.setAttributeNS(null, 'points', getCurvePoints(coords));
  poly.setAttributeNS(null, 'stroke-opacity', '0.0');
  return poly;
}

function createBubbleStub(offsetX, offsetY) {
  // create same-size bubble
  var bubble = createElement('circle'); // this is constant, since it is a bubble

  if (isNaN(offsetX)) {
    alert('offsetX: ' + offsetX.toString());
  }

  if (isNaN(offsetY)) {
    alert('offsetY: ' + offsetY.toString());
  }

  bubble.setAttributeNS(null, 'cx', offsetX); // start x

  bubble.setAttributeNS(null, 'cy', offsetY); // start y

  bubble.setAttributeNS(null, 'r', bubbleRadius); // radius

  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  bubble.setAttributeNS(null, 'stroke', '#222222'); // set scaffold attrs

  bubble.setAttributeNS(null, 'stroke-width', bubbleRadius * 0.25);
  return bubble;
}

function getAttributeValue(element, attr) {
  // convert string numeric and truncate to one place after decimal
  return parseFloat(parseFloat(element.attributes[attr].value).toFixed(1));
}

function getModel(element) {
  // by svg element type, return its salient model attributes for bubbles
  var ox = 0;
  var oy = 0;
  var p1 = 1;
  var p2 = 1;

  switch (element) {
    case 'polyline':
      return {
        'points': p1
      };

    case 'polygon':
      return {
        'points': p1
      };

    case 'rect':
      return {
        'x': ox,
        'y': oy,
        'width': p1,
        'height': p2
      };

    case 'line':
      return {
        'x1': ox,
        'y1': oy,
        'x2': p1,
        'y2': p2
      };

    case 'circle':
      return {
        'cx': ox,
        'cy': oy,
        'r': p1
      };

    case 'ellipse':
      return {
        'cx': ox,
        'cy': oy,
        'rx': p1,
        'ry': p2
      };

    case 'path':
      //  //////// only for curve !!!
      return {
        'x1': ox,
        'y1': oy,
        'xc1': p1,
        'yc1': p2,
        'xc2': p1,
        'yc2': p2,
        'x2': ox,
        'y2': oy
      };

    case 'text':
      return {
        'x': ox,
        'y': oy
      };
  } // end switch

}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

SVGDraw.prototype.onSvgMouseMove = function () {
  var self = this;
  return function (event) {
    self.renderFunction(event);
    event.preventDefault();
    return false;
  };
};

function length2points(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

var Trig = {
  distanceBetween2Points: function distanceBetween2Points(point1, point2) {
    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  },
  angleBetween2Points: function angleBetween2Points(point1, point2) {
    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.atan2(dx, dy);
  }
};

SVGDraw.prototype.updateMousePosition = function (event) {
  var target;

  if (this.touchSupported) {
    target = event.originalEvent.touches[0];
  } else {
    target = event;
  }

  var offset = svgOffset; //  was this.canvas.offset();

  this.lastMousePoint.x = target.pageX - offset.left;
  this.lastMousePoint.y = target.pageY - offset.top;
  lastMouseX = this.lastMousePoint.x;
  lastMouseY = this.lastMousePoint.y;
};

SVGDraw.prototype.updateSvgByElement = function (event) {
  /*
   This section services updating of svg element thisElement from onSvgMouseMove
    The initial scheme prior to editing of elements was to dynamically update the current point
   of the currently being created thisElement. This point has been the latest or final point
   in the element, where <circle>, <ellipse>, <rect>angle, and <line> have only the initial
   point (set during onSvgMouseDown) and a final point/datum.
    The general scheme up to implementation of editing <line>/<polyline>/<polygon> element types
   has been to articulate thisElement through the svgInProgress state (SHIFT, SIZE, cursorMode)
   where SHIFT moves the entire element, typically through the initial point set during
   onSvgMouseDown.For what had been effectively a resizing operation, sleight of hand set up the
   modes and states to resume processing of thisElement AS IF it had just been created and was
   as usual dynamically defining the second point/datum.
    On implementation of <line> editing, the initial decision was to make both endpoints (x1, y1)
   (x2, y2) repositionable rather than have the initial point move the line (which would entail
   adjusting both points in concert - no big deal, but not clearly preferable to individually
   moving each endpoint). This implementation surfaced the issue of point identification for the
   onSvgMouseMove handler. Clearly implications are paramount for <polyline>/<polygon> editing,
   and so a perversion of the SHIFT mode was temporarily used for <line> while development of a
   proper technique for <poly-...> proceeds.
   */
  if (cursorMode != "MOVE") {
    // if we are not moving(dragging) the SVG check the known tags
    if (cursorMode == "polygon" || cursorMode == 'polyline' && svgInProgress == 'polygon') {
      if (svgInProgress == false) {
        return;
      } // could be POINT or NEW or polygon


      this.updateMousePosition(event);

      if (svgInProgress == 'SHIFT') {
        var shiftPoint = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString();
        var shiftingPoints = thisElement.attributes['points'].value.trim();
        var splitShiftPoints = shiftingPoints.split(' ');

        if (thisBubble != null) {
          // thisBubble set on mousedown
          var cx = parseFloat(thisBubble.attributes['cx'].value); // old

          var cy = parseFloat(thisBubble.attributes['cy'].value); // x, y

          var cx2 = (lastMouseX - xC) / zoom; // new x

          var cy2 = (lastMouseY - yC) / zoom; // , y

          var dx = cx2 - cx;
          var dy = cy2 - cy;
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom; // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way

          var shiftedPoints = '';
          var j; //iterator for decomposing x, y point lists

          var xPoints = [];
          var yPoints = [];

          for (j = 0; j < splitShiftPoints.length; j++) {
            var thisXY = splitShiftPoints[j].split(',');
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(3);
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(3);
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' ';
          }

          for (var k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' ';
          }

          thisElement.attributes['points'].value = shiftedPoints;
        }
      } else {
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString();
        var thesePoints = thisElement.attributes['points'].value.trim();
        var splitPoints = thesePoints.split(' ');

        if (thisBubble != null) {
          // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

          if (isNumeric(thisBubble.id)) {
            // presume integer for now
            splitPoints[parseInt(thisBubble.id)] = thisPoint;
            thesePoints = '';

            for (var _k2 = 0; _k2 < splitPoints.length; _k2++) {
              thesePoints += splitPoints[_k2] + ' ';
            }

            thisElement.attributes['points'].value = thesePoints;
          }
        } else {
          // svgInProgress = 'polygon', so normal creation of element adding new point to end
          thesePoints = ''; // clear thecollector

          for (var _k3 = 0; _k3 < splitPoints.length - 1; _k3++) {
            // reconstruct except for the last point
            thesePoints += splitPoints[_k3] + ' '; // space delimiter at the end of each coordinate
          }

          thisPoint += ' ';
          thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
        }
      }
    } else if (cursorMode == "polyline") {
      if (svgInProgress == false) {
        return;
      }

      this.updateMousePosition(event);

      if (svgInProgress == 'SHIFT') {
        var _shiftPoint = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString();

        var _shiftingPoints = thisElement.attributes['points'].value.trim();

        var _splitShiftPoints = _shiftingPoints.split(' ');

        if (thisBubble != null) {
          // thisBubble set on mousedown
          var _cx = parseFloat(thisBubble.attributes['cx'].value); // old


          var _cy = parseFloat(thisBubble.attributes['cy'].value); // x, y


          var _cx2 = (lastMouseX - xC) / zoom; // new x


          var _cy2 = (lastMouseY - yC) / zoom; // , y


          var _dx = _cx2 - _cx;

          var _dy = _cy2 - _cy;

          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom; // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way

          var _shiftedPoints = '';

          var _j; //iterator for decomposing x, y point lists


          var _xPoints = [];
          var _yPoints = [];

          for (_j = 0; _j < _splitShiftPoints.length; _j++) {
            var _thisXY = _splitShiftPoints[_j].split(',');

            _xPoints[_j] = (parseFloat(_thisXY[0]) + _dx).toFixed(3);
            _yPoints[_j] = (parseFloat(_thisXY[1]) + _dy).toFixed(3);
            _shiftedPoints += _xPoints[_j] + ',' + _yPoints[_j] + ' ';
          }

          for (var _k4 = 0; _k4 < _splitShiftPoints.length; _k4++) {
            _shiftingPoints += _splitShiftPoints[_k4] + ' ';
          }

          thisElement.attributes['points'].value = _shiftedPoints;
        }
      } else {
        var _thisPoint2 = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString();

        var _thesePoints2 = thisElement.attributes['points'].value.trim();

        var _splitPoints = _thesePoints2.split(' ');

        if (thisBubble != null) {
          // look for bubble to denote just move THIS point only
          // currently, no distinction is made between existing vertex and new point
          // however, this may change in the future JRF 23NOV15
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

          if (isNumeric(thisBubble.id)) {
            // presume integer for now
            _splitPoints[parseInt(thisBubble.id)] = _thisPoint2; // replace this point

            _thesePoints2 = '';

            for (var _k5 = 0; _k5 < _splitPoints.length; _k5++) {
              _thesePoints2 += _splitPoints[_k5] + ' ';
            }

            thisElement.attributes['points'].value = _thesePoints2;
          }
        } else {
          _thesePoints2 = ''; // clear the collector

          for (var _k6 = 0; _k6 < _splitPoints.length - 1; _k6++) {
            // reconstruct except for the last point
            _thesePoints2 += _splitPoints[_k6] + ' '; // space delimiter at the end of each coordinate
          }

          _thisPoint2 += ' ';
          thisElement.attributes['points'].value = _thesePoints2.concat(_thisPoint2);
        }
      }
    } else if (cursorMode == "rect")
      /*|| (cursorMode == 'bubble')*/
      {
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        if (
        /*(event.type == 'mousedown') || */
        svgInProgress == false) {
          return;
        }

        if (svgInProgress == 'SHIFT') {
          this.updateMousePosition(event);
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
          thisElement.attributes['x'].value = (lastMouseX - xC) / zoom; // correspondingly translate thisElement

          thisElement.attributes['y'].value = (lastMouseY - yC) / zoom;
        } else {
          var thisRectX = thisElement.attributes['x'].value;
          var thisRectY = thisElement.attributes['y'].value; // var thisRectW = thisElement.attributes['width'].value;
          // var thisRectH = thisElement.attributes['height'].value;

          this.updateMousePosition(event);
          thisElement.attributes['width'].value = (lastMouseX - xC) / zoom - thisRectX;
          thisElement.attributes['height'].value = (lastMouseY - yC) / zoom - thisRectY;

          if (thisBubble) {
            thisBubble = event.target;
            thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

            thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
          } //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects

        }
      } else if (cursorMode == "line") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var linePoints;

      if (event.type == 'mousedown' || svgInProgress == false) {
        // extra condition for line
        console.log('cursorMode=line abort event:' + event.type + ' svgInProgress= ' + svgInProgress);
        return;
      }

      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        var x1 = parseFloat(thisElement.attributes['x1'].value);
        var y1 = parseFloat(thisElement.attributes['y1'].value);
        var x2 = parseFloat(thisElement.attributes['x2'].value);
        var y2 = parseFloat(thisElement.attributes['y2'].value); // thisBubble set on mousedown

        var _cx3 = parseFloat(thisBubble.attributes['cx'].value);

        var _cy3 = parseFloat(thisBubble.attributes['cy'].value);

        var _cx4 = (lastMouseX - xC) / zoom;

        var _cy4 = (lastMouseY - yC) / zoom;

        var _dx2 = _cx3 - _cx4;

        var _dy2 = _cy4 - _cy3;

        if (thisBubble) {
          thisBubble.attributes['cx'].value = _cx4; // translate the bubble

          thisBubble.attributes['cy'].value = _cy4;
          thisElement.attributes['x1'].value = x1 - _dx2; // correspondingly translate thisElement

          thisElement.attributes['y1'].value = _dy2 + y1;
          thisElement.attributes['x2'].value = x2 - _dx2; // correspondingly translate thisElement

          thisElement.attributes['y2'].value = _dy2 + y2;
        }
      } else {
        // repositioning either line endpoint
        this.updateMousePosition(event);
        linePoints = ['x2', 'y2']; // preset for normal post-creation mode

        if (thisBubble != null) {
          // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

          if (!isNumeric(thisBubble.id)) {
            // presume either 'x1-y1' or 'x2-y2'
            linePoints = thisBubble.id.split('-'); // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }

          if (thisGroup.lastChild.firstChild.id == 'shift') {
            thisGroup.lastChild.firstChild.remove(); // kill off the move line bubble
          }
        }

        thisElement.attributes[linePoints[0]].value = (lastMouseX - xC) / zoom;
        thisElement.attributes[linePoints[1]].value = (lastMouseY - yC) / zoom;
        console.log('x: ' + ((lastMouseX - xC) / zoom).toString() + ' / y: ' + ((lastMouseY - yC) / zoom).toString());
      } //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects

    } else if (cursorMode == 'arrow') {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;

      var _linePoints;

      if (event.type == 'mousedown' || svgInProgress == false) {
        // extra condition for line
        return;
      }

      var mainLine = thisGroup.children[0];
      this.updateMousePosition(event);

      if (svgInProgress == 'SHIFT') {
        var _x = parseFloat(mainLine.attributes['x1'].value);

        var _y = parseFloat(mainLine.attributes['y1'].value);

        var _x2 = parseFloat(mainLine.attributes['x2'].value);

        var _y2 = parseFloat(mainLine.attributes['y2'].value); // thisBubble set on mousedown -- except not here for some reason TBD


        if (!thisBubble) {
          thisBubble = mainLine.parentElement.lastChild.children['shift'];
        }

        var _cx5 = parseFloat(thisBubble.attributes['cx'].value);

        var _cy5 = parseFloat(thisBubble.attributes['cy'].value);

        var _cx6 = (lastMouseX - xC) / zoom;

        var _cy6 = (lastMouseY - yC) / zoom;

        var _dx4 = _cx5 - _cx6;

        var _dy4 = _cy6 - _cy5;

        thisBubble.attributes['cx'].value = _cx6; // translate the bubble

        thisBubble.attributes['cy'].value = _cy6;
        mainLine.attributes['x1'].value = _x - _dx4; // correspondingly

        mainLine.attributes['y1'].value = _dy4 + _y;
        mainLine.attributes['x2'].value = _x2 - _dx4; // translate mainLine

        mainLine.attributes['y2'].value = _dy4 + _y2;
      } else {
        _linePoints = ['x2', 'y2']; // preset for normal post-creation mode

        if (thisBubble != null) {
          // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

          if (!isNumeric(thisBubble.id)) {
            // presume either 'x1-y1' or 'x2-y2'
            _linePoints = thisBubble.id.split('-'); // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
        }

        mainLine.attributes[_linePoints[0]].value = (lastMouseX - xC) / zoom;
        mainLine.attributes[_linePoints[1]].value = (lastMouseY - yC) / zoom;
      }

      while (thisGroup.childElementCount > 1) {
        // remove everything except the main line
        thisGroup.lastChild.remove(); // ///////////////////  VERY TEMPORARY METHOD
      }

      var thisX1 = thisElement.attributes['x1'].value; // shorter references to original line's values

      var thisY1 = thisElement.attributes['y1'].value;
      var thisX2 = thisElement.attributes['x2'].value;
      var thisY2 = thisElement.attributes['y2'].value;
      var thisColor = thisElement.attributes['stroke'].value;
      var deltaX = thisX2 - thisX1;
      var deltaY = thisY2 - thisY1;
      var lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (lineLength == 0) {
        lineLength = 1;
      } // preempt divide by 0


      var _dx3 = deltaX / lineLength;

      var _dy3 = deltaY / lineLength;

      var barbLength;

      if (document.getElementById('arrowHeadPixels').checked) {
        barbLength = document.getElementById('arrowHeadLength').value;
      } else {
        barbLength = lineLength * arrowPercent / 100;
      }

      var pctX = parseFloat(thisX2) - _dx3 * barbLength; //  baseline for barb trailing end


      var pctY = parseFloat(thisY2) - _dy3 * barbLength;

      var x3 = (pctX + barbLength * _dy3 / 2).toFixed(3);
      var y3 = (pctY - barbLength * _dx3 / 2).toFixed(3);
      var x4 = (pctX - barbLength * _dy3 / 2).toFixed(3);
      var y4 = (pctY + barbLength * _dx3 / 2).toFixed(3);
      var leftBarb = createElement('line');
      leftBarb.setAttributeNS(null, 'x1', thisX2); // start x of barbs

      leftBarb.setAttributeNS(null, 'y1', thisY2); // start y of barbs

      leftBarb.setAttributeNS(null, 'x2', x3); // end x

      leftBarb.setAttributeNS(null, 'y2', y3); // end y

      leftBarb.setAttributeNS(null, 'stroke', thisColor); // thisGroup.appendChild(leftBarb);

      var rightBarb = createElement('line');
      rightBarb.setAttributeNS(null, 'x1', thisX2); // start x of barbs

      rightBarb.setAttributeNS(null, 'y1', thisY2); // start y of barbs

      rightBarb.setAttributeNS(null, 'x2', x4); // end x

      rightBarb.setAttributeNS(null, 'y2', y4); // end y

      rightBarb.setAttributeNS(null, 'stroke', thisColor); // thisGroup.appendChild(rightBarb);

      if (document.getElementById('arrowHeadClosed').checked) {
        // baseBarb = createElement('line');
        // baseBarb.setAttributeNS(null, 'x1', x3);       // start x of barbs base
        // baseBarb.setAttributeNS(null, 'y1', y3);      // start y of barbs base
        // baseBarb.setAttributeNS(null, 'x2', x4);      // end x
        // baseBarb.setAttributeNS(null, 'y2', y4);      // end y
        // baseBarb.setAttributeNS(null, 'stroke', thisColor);
        var baseBarb = createElement('polygon');
        var barbPoints = thisX2 + ',' + thisY2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4;
        baseBarb.setAttributeNS(null, 'points', barbPoints);
        baseBarb.setAttributeNS(null, 'stroke', thisColor);
        thisGroup.appendChild(baseBarb);
      } else {
        thisGroup.appendChild(leftBarb);
        thisGroup.appendChild(rightBarb);
      }
    } else if (cursorMode == "circle")
      /*|| (cursorMode == 'bubble')*/
      {
        //thisCircle = thisElement;             // first step toward generalizing SHIFT/SIZE handlers
        if (event.type == 'mousedown' || svgInProgress == false) {
          return; // //// this has been verified to actually occur
        }

        if (svgInProgress == 'SHIFT') {
          // changing position of this element
          this.updateMousePosition(event);
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
          thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom; // correspondingly translate thisElement

          thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
        } else {
          // either resizing or originally sizing
          //this.context.moveTo(lastMouseX, lastMouseY);
          var thisCircX = thisElement.attributes['cx'].value;
          var thisCircY = thisElement.attributes['cy'].value;
          this.updateMousePosition(event);
          lastMouseX = this.lastMousePoint.x;
          lastMouseY = this.lastMousePoint.y;
          var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
          thisElement.attributes['r'].value = radius;

          if (thisBubble) {
            thisBubble = event.target;

            switch (thisBubble.id) {
              case 'E':
                thisBubble.attributes['cx'].value = parseFloat(thisCircX) + radius;
                break;

              case 'S':
                thisBubble.attributes['cy'].value = parseFloat(thisCircY) + radius;
                break;

              case 'W':
                thisBubble.attributes['cx'].value = parseFloat(thisCircX) - radius;
                break;

              case 'N':
                thisBubble.attributes['cy'].value = parseFloat(thisCircY) - radius;
                break;
            }
          }

          var bubbles = event.target.parentElement.children;

          if (bubbles['E']) {
            // translate editing circle's bubbles
            bubbles['E'].attributes['cx'].value = parseFloat(thisCircX) + radius;
            bubbles['S'].attributes['cy'].value = parseFloat(thisCircY) + radius;
            bubbles['W'].attributes['cx'].value = parseFloat(thisCircX) - radius;
            bubbles['N'].attributes['cy'].value = parseFloat(thisCircY) - radius;
          } //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects

        }
      } else if (cursorMode == "ellipse") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;

      if (event.type == 'mousedown' || svgInProgress == false) {
        return;
      }

      if (svgInProgress == 'SHIFT') {
        // changing position of this element
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom; // correspondingly translate thisElement

        thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
      } else {
        // resizing: cursor NOW osculates ellipse as in circle, diagonally positioned
        var thisEllipseX = thisElement.attributes['cx'].value;
        var thisEllipseY = thisElement.attributes['cy'].value;
        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        thisElement.attributes['rx'].value = Math.abs(thisEllipseX - (lastMouseX - xC) / zoom) * 1.414;
        thisElement.attributes['ry'].value = Math.abs(thisEllipseY - (lastMouseY - yC) / zoom) * 1.414;
      }
    } else if (cursorMode == "draw") {
      if (svgInProgress == false) {
        return;
      }

      this.updateMousePosition(event);
      var _thesePoints3 = thisElement.attributes['points'].value;

      var _thisPoint3 = ((lastMouseX - xC) / zoom).toFixed(3).toString() + ',' + ((lastMouseY - yC) / zoom).toFixed(3).toString() + ' ';

      thisElement.attributes['points'].value = _thesePoints3.concat(_thisPoint3);
    } else if (cursorMode == 'cubic' || cursorMode == 'quadratic') {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;

      if (event.type == 'mousedown' || svgInProgress == false) {
        // extra condition for line
        return;
      }

      this.updateMousePosition(event);
      var thisDvalue = thisElement.attributes['d'].value;
      var thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0;

      if (thisBubble != null) {
        // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        var thisX = (lastMouseX - xC) / zoom;
        var thisY = (lastMouseY - yC) / zoom;

        var _thisX = parseFloat(thisBubble.attributes['cx'].value);

        var _thisY = parseFloat(thisBubble.attributes['cy'].value);

        console.log('endpoints: [' + thisX + ', ' + thisY + '], [' + _thisX + ', ' + _thisY + ']');

        var _dx5 = thisX - _thisX;

        var _dy5 = thisY - _thisY;

        thisBubble.attributes['cx'].value = thisX; // translate the bubble

        thisBubble.attributes['cy'].value = thisY;
        var theseCoords = getCurveCoords(thisDvalue); //#TODO: fix incremental mistracking of shift point, bubble no longer present

        if (thisBubble.id == 'shift') {
          console.log(thisDvalue);
          console.log('dx: ' + _dx5 + ', dy: ' + _dy5); // tranlate each coordinate (array contains x, y, x, y, ... x, y

          for (var _k7 = 0; _k7 < theseCoords.length; _k7++) {
            theseCoords[_k7] = (_dx5 + parseFloat(theseCoords[_k7])).toFixed(3);
            theseCoords[_k7 + 1] = (_dy5 + parseFloat(theseCoords[_k7 + 1])).toFixed(3);
            _k7++;
          }

          if (thisCurveQuadratic) {
            //////// this is a kludge to make user the param names line up in getCurveCoords
            theseCoords[6] = theseCoords[4]; // populate template curve p2

            theseCoords[7] = theseCoords[5]; // coordinates from quadratic p2 values
          }

          thisElement.attributes['d'].value = getCurvePath(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7]); // responds to both C and Q curves

          console.log(thisElement.attributes['d'].value);
        } //
        // worksheet data for quadratic and cubic curves is conformed to the same model
        // p1: [0,1], c1: [2,3], c2: [3,4], p2: [6,7]. Only one control point is used
        // for quadratic when actually rendered
        else {
            // process non-shift bubble
            if (thisCurveQuadratic) {
              //////// this is a kludge to make user the param names line up in getCurveCoords
              theseCoords[6] = theseCoords[4]; // populate template curve p2

              theseCoords[7] = theseCoords[5]; // coordinates from quadratic p2 values
            }

            switch (thisBubble.id) {
              case 'p1':
                theseCoords[0] = thisX.toFixed(3);
                theseCoords[1] = thisY.toFixed(3);
                break;

              case 'p2':
                theseCoords[6] = thisX.toFixed(3);
                theseCoords[7] = thisY.toFixed(3);
                break;

              case 'c1':
                theseCoords[2] = thisX.toFixed(3);
                theseCoords[3] = thisY.toFixed(3);
                break;

              case 'c2':
                theseCoords[4] = thisX.toFixed(3);
                theseCoords[5] = thisY.toFixed(3);
                break;
            }

            if (thisCurveQuadratic) {
              theseCoords[4] = theseCoords[2]; // force quadratic curve control

              theseCoords[5] = theseCoords[3]; // points to be the same point
            } // 'd' is the string containing the path parameters; set it to the updated values


            thisElement.attributes['d'].value = getCurvePath(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7]); // responds to both C and Q curves
            // now set the lines for the control points; two lines (l1 and l2) whether cubic or quadratic

            thisElement.parentElement.lastChild.children['l1'].attributes['x1'].value = theseCoords[0];
            thisElement.parentElement.lastChild.children['l1'].attributes['y1'].value = theseCoords[1];
            thisElement.parentElement.lastChild.children['l1'].attributes['x2'].value = theseCoords[2];
            thisElement.parentElement.lastChild.children['l1'].attributes['y2'].value = theseCoords[3];
            thisElement.parentElement.lastChild.children['l2'].attributes['x1'].value = theseCoords[4];
            thisElement.parentElement.lastChild.children['l2'].attributes['y1'].value = theseCoords[5];
            thisElement.parentElement.lastChild.children['l2'].attributes['x2'].value = theseCoords[6];
            thisElement.parentElement.lastChild.children['l2'].attributes['y2'].value = theseCoords[7];
            thisElement.parentElement.lastChild.children['poly'].attributes['points'].value = getCurvePoints(theseCoords) + theseCoords[0] + ', ' + theseCoords[1]; // 'poly' is bounding polygon of endpoints and control points
          }
      } else {
        // defining initial curve as straight line, i.e., rubber-banding p2 until mouseup
        var _thisX2 = (lastMouseX - xC) / zoom;

        var _thisY2 = (lastMouseY - yC) / zoom;

        var thisD;
        var thisPathType = ' C '; // set quadratic control point at midpoint, cubic's at 40% and 60% p1:p2

        if (cursorMode == 'quadratic') thisPathType = ' Q ';
        var theseCurvePoints = thisDvalue.split(thisPathType); // isolate control point(s) and p2

        var thisP1 = theseCurvePoints[0].split('M '); // isolate p1

        thisP1 = thisP1[1].split(', ');

        var _thisX3 = parseInt(thisP1[0]);

        var _thisY3 = parseInt(thisP1[1]);

        var _dx6 = _thisX3 - _thisX2;

        var _dy6 = _thisY3 - _thisY2;

        var theseControlPoints = theseCurvePoints[1].split(', '); // get array of x,y,x,y(,x,y)

        if (thisPathType == ' Q ') {
          theseControlPoints[0] = (_thisX3 - 0.4 * _dx6).toFixed(3); // single control point

          theseControlPoints[1] = (_thisY3 - 0.4 * _dy6).toFixed(3); // for quadratic

          thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
        } else {
          // if (cursorMode == 'cubic')
          theseControlPoints[0] = (_thisX3 - 0.4 * _dx6).toFixed(3);
          theseControlPoints[1] = (_thisY3 - 0.4 * _dy6).toFixed(3);
          theseControlPoints[2] = (_thisX3 - 0.6 * _dx6).toFixed(3);
          theseControlPoints[3] = (_thisY3 - 0.6 * _dy6).toFixed(3);
          thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
          thisD += curvePoint(theseControlPoints[2], theseControlPoints[3]);
          thisD += curvePoint(_thisX2, _thisY2);
          console.log('p1: ' + thisP1[0] + ', ' + thisP1[1]);
          console.log('control points: ' + theseControlPoints[0] + ', ' + theseControlPoints[1] + ' ... ' + theseControlPoints[2] + ', ' + theseControlPoints[3]);
          console.log('p2: ' + _thisX2 + ', ' + _thisY2);
        }

        thisD += pathPoint(_thisX2, _thisY2);
        thisElement.attributes['d'].value = thisD;
      }
    } else if (cursorMode == "text") {
      // translate
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom; // translate the bubble

        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

        for (var i = 0; i < thisGroup.children.length; i++) {
          // for any text lines in this group (skip bubble)
          if (thisGroup.children[i].tagName == 'text') {
            // only shift text elements, not bubbles
            thisGroup.children[i].attributes['x'].value = (lastMouseX - xC) / zoom; // translate each <text> element

            thisGroup.children[i].attributes['y'].value = (lastMouseY - yC) / zoom + i * textHeight;
          } else {
            // translate the bubble
            thisGroup.children[i].children[0].attributes['cx'].value = (lastMouseX - xC) / zoom; // translate each <text> element

            thisGroup.children[i].children[0].attributes['cy'].value = (lastMouseY - yC) / zoom
            /* + (i * textHeight)*/
            ;
          }
        }
      }
    }
  } else if (cursorMode == 'MOVE') {
    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via xC, yC
    if (svgInProgress == 'MOVE') {
      var oldX = this.lastMousePoint.x;
      var oldY = this.lastMousePoint.y;
      this.updateMousePosition(event); //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;

      xC = xC - (oldX - lastMouseX);
      yC = yC - (oldY - lastMouseY);
      zoom_trans(xC, yC, zoom); // effects the translation to xC, yC in the transform
    }
  }

  return event.preventDefault() && false;
};

SVGDraw.prototype.onSvgMouseUp = function (event) {
  var self = this;
  return function (event) {
    if (!svgInProgress) {
      // i.e., if svgInProgress is not false
      return event.preventDefault() && false;
    }

    if (svgInProgress == 'SHIFT') {
      // this is also catching mouseUp from bubbles!!!
      // mouseup implies end of position shift or resize  ///// HELLO ///// ^^^^^^^
      svgInProgress = false;
      clearEditElement(thisGroup);
    } else if (svgInProgress == 'SIZE') {
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      setElementMouseEnterLeave(thisElement.parentNode); // this element is a SHIFT bubble
    } else if (cursorMode == 'bubble') {
      // /////// all assignments of cursorMode to bubble have been disabled
      svgInProgress = false;
    } else if (cursorMode == 'draw') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);
    } else if (cursorMode == 'cubic' || cursorMode == 'quadratic') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);
    } else if (cursorMode == "MOVE")
      /*&& (svgInProgress == cursorMode)*/
      {
        svgInProgress = false; // unbindMouseHandlers(self);
      } else if (cursorMode == 'rect') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);

      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'line') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);

      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'arrow') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);

      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'polygon') {
      if (thisBubble == null) {} else {
        svgInProgress = false;
        setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);

        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    } else if (cursorMode == 'polyline') {
      if (thisBubble == null) {} else {
        svgInProgress = false;
        setElementMouseEnterLeave(thisGroup); // unbindMouseHandlers(self);

        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    } else if (cursorMode == 'circle') {
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'ellipse') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == "text") {
      // focus on the text entry input since this fails in mouseDown
      //document.getElementById('text4svg').focus();        // control eliminated
      if (svgInProgress == false) {
        if (thisGroup.lastChild.tagName == 'circle') {
          // thisGroup.lastChild.remove();
          clearEditElement(group);
        }

        setElementMouseEnterLeave(thisGroup);
      }
    }

    thisSVGpoints = []; // and clear the collector
    //return event.preventDefault() && false;

    return false;
  }; //return event.preventDefault() && false;
};
/*
 Consider the extension of Escape vs Enter key to terminate all element creation functions:
 Escape originally envisioned as abort key, but slightly perverted for text.
 Currently supported in text as function termination. Enter causes new line.
 Poly-s currently supported by Enter and/or double-click
 line; rectangle; circle; ellipse; cubic quadratic all now terminate on Enter, ABORT on Escape, including edited element
 */


SVGDraw.prototype.keyUpHandler = function () {
  var self = this;
  return function (event) {
    if (event.keyCode == 0x14) {
      capsLock = !capsLock;
    }
  };
};

SVGDraw.prototype.keyHandler = function () {
  var self = this;
  return function (event) {
    // event.preventDefault();
    // Due to browser differences from fireFox, use event.keyCode vs key since key is undefined in Chrome and Safari
    var thisKeyCode = event.keyCode;
    var inFocus = document.activeElement;

    switch (thisKeyCode) {
      case 16:
        // shift
        thisKey = 'Shift';
        secondKey = firstKey;
        firstKey = thisKey;
        return;

      case 0x14:
        capsLock = !capsLock;
        return;

      case (91, 93):
        thisKey = 'Meta';
        secondKey = firstKey;
        firstKey = thisKey;
        return;

      case 0x52:
        // looking to pick off ctrl-shift-R or shift-Apple-R
        if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
          location.reload(true);
        }

      case 0x42:
        // looking for control-B to move mouseovered group to "bottom"
        if (event.ctrlKey) {
          // which is first in the SVG list
          if (thisGroup) {
            var cloneGroup = thisGroup.cloneNode(true);
            thisGroup.remove();
            clearEditElement(cloneGroup);
            svgLayer.firstChild.insertBefore(cloneGroup, svgLayer.firstChild.childNodes[1]);
          }
        }

      case 0x54:
        // looking for control-T to move mouseovered group to "top"
        if (event.ctrlKey) {
          // which is last in the SVG element list
          if (thisGroup) {
            var _cloneGroup = thisGroup.cloneNode(true);

            thisGroup.remove();
            clearEditElement(_cloneGroup);
            svgLayer.firstChild.appendChild(_cloneGroup);
          }
        }

      default:
        secondKey = null;
        firstKey = thisKey;
    }

    if (cursorMode == 'text' && (inFocus.tagName == 'BODY' || inFocus.id == svgLayer.parentElement.id)) {
      updateSvgText(event); // pass event or key

      return;
    }

    if (event.key == 'Enter' || thisKeyCode == 13) {
      // added literal decimal value for chrome/safari
      switch (cursorMode) {
        case 'polygon':
          dblClick();
          return;

        case 'polyline':
          dblClick();
          return;

        case 'line':
          doMouseUp();
          return;

        case 'rectangle':
          doMouseUp();
          return;

        case 'circle':
          doMouseUp();
          return;

        case 'ellipse':
          doMouseUp();
          return;

        case 'cubic':
          doMouseUp();
          return;

        case 'quadratic':
          doMouseUp();
          return;

        case 'draw':
          doMouseUp();
          return;
      }
    }

    if (event.key == 'Delete' || event.key == 'Backspace' || thisKeyCode == 0x2E || thisKeyCode == 0x08) {
      if (event.shiftKey) {
        //                       Delete                  Backspage
        clearThisGroup(thisGroup);
        svgInProgress = false;
        setCursorMode('MOVE');
        return;
      }

      if (inFocus.tagName == 'BODY' || inFocus.id == svgLayer.parentElement.id) {
        event.preventDefault();
        return;
      }
    }

    if (event.key == 'Escape' || thisKeyCode == 27) {
      switch (cursorMode) {
        case ('polygon', 'polyline'):
          if (svgInProgress == cursorMode) {
            // remove last point and reset previous point to dynamic
            deleteLastPoint(thisElement);
            return;
          }

      }

      return;
    }
  };
};

function lookUpKey(event) {
  // sort out the keyboard mess and return the key
  var eventKey = event.key;
  var thisKeyCode = event.keyCode;
  var thisCharCode = event.charCode;
  var Shifted = event.shiftKey;
  var Control = event.ctrlKey;

  if (thisKeyCode == 0x14) {
    //var CapsLock = isCapsLockOn(event);
    capsLock = !capsLock; // on keyDown and capsLock keyCode (= 20d or 0x14)

    return false;
  }

  var mapKey = _KEYCODE_MAP[thisKeyCode]; // from CapsLock.js, non-alphanumeric keys

  if (mapKey) {
    // existence mostly implies we caught one
    if (Shifted && _SHIFTMAP[mapKey]) {
      // if there is a shifted version of this key
      return _SHIFTMAP[mapKey]; // and the shift key is down (not CapsLock)
    }

    return mapKey; // if not shift, return nominal key
  }

  if (thisKeyCode > 0x2F && thisKeyCode < 0x3A) {
    // numeric key
    eventKey = String.fromCharCode(thisKeyCode); // need mapping to us keyboard at minimum

    if (Shifted) {
      return _SHIFTMAP[eventKey];
    }

    return eventKey;
  }

  if (thisKeyCode > 0x3F && thisKeyCode < 0x5B || thisKeyCode == 0x20) {
    // Alphabetic key (codes are upper case)
    eventKey = String.fromCharCode(thisKeyCode); // need mapping to us keyboard at minimum

    if (capsLock) {
      if (isMac) {
        // for Apple, shiftKey does not affect CapsLock
        return eventKey.toUpperCase(); // so force CAPS on any Alpha
      } else {
        if (Shifted) {
          return eventKey.toLowerCase(); // shift and CapsLock implies lower case for Oranges
        } else {
          return eventKey.toUpperCase(); // do not invert sense of CapsLock
        }
      }
    } else {
      // not caps lock
      if (Shifted) {
        return eventKey;
      }

      return eventKey.toLowerCase();
    }
  }

  return false; // signal not printable
}

function doMouseUp() {
  svgInProgress = false;
  setElementMouseEnterLeave(thisGroup);
  setCursorMode('MOVE'); // unbindMouseHandlers(self);

  thisBubble = null;
  thisElement = null;
  thisGroup = null;
}

SVGDraw.prototype.doubleClickHandler = function () {
  var self = this;
  return function () {
    dblClick();
  };
};

function dblClick() {
  if (cursorMode == 'polygon' || cursorMode == 'polyline') {
    svgInProgress = false;

    switch (cursorMode) {
      case 'polygon':
        deleteDuplicatePoints(thisElement);
        thisGroup.innerHTML = thisGroup.innerHTML.replace('polyline', 'polygon').replace('polyline', 'polygon');
        setElementMouseEnterLeave(thisGroup);
        break;

      case 'polyline':
        deleteDuplicatePoints(thisElement);
        setElementMouseEnterLeave(thisGroup);
        break;
    }

    if (cursorMode == 'text') {
      closeSvgText();
    }

    thisElement = null;
    thisGroup = null; // unbindMouseHandlers(self);
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  var self = this;
  return function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    var deltaDiv = 1000; // default for non-FireFox

    if (event.type == "DOMMouseScroll") {
      deltaDiv = 100;
    } // adjust for FireFox
    //var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
    //lastMouseX = (event.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
    //lastMouseY = (event.originalEvent.clientY - svgOffset.top);


    var delta = -parseInt(event.deltaY || -event.detail);
    lastMouseX = event.clientX - svgOffset.left; // fixed reference for mouse offset

    lastMouseY = event.clientY - svgOffset.top;
    var zoomDelta = delta / deltaDiv;

    if (zoomDelta > 0) {
      zoomIn();
    } else {
      zoomOut();
    }

    return event.preventDefault() && false;
  };
};

function deleteDuplicatePoints(element) {
  var thesePoints = element.attributes['points'].value.trim();
  var splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';

  for (var k = 1; k < splitPoints.length; k++) {
    // if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
    //   thesePoints += splitPoints[k] + ' ';        // if it is "new"
    // }
    if (checkDuplicatePoints(splitPoints[k - 1], splitPoints[k])) {
      // only keep this point
      thesePoints += splitPoints[k] + ' '; // if it is "new"
    }
  }

  thisElement.attributes['points'].value = thesePoints;
}

function deleteLastPoint(element) {
  // specific to <poly-> ESC key
  var thesePoints = element.attributes['points'].value.trim();
  var splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';

  for (var k = 1; k < splitPoints.length - 1; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {
      // only keep this point
      thesePoints += splitPoints[k] + ' '; // if it is "new"
    }
  }

  thisElement.attributes['points'].value = thesePoints;
}

function checkDuplicatePoints(pxy, qxy) {
  // return false if too close together
  var p = pxy.split(',');
  var q = qxy.split(',');
  var px = p[0];
  var py = p[1];
  var qx = q[0];
  var qy = q[1];

  if (Math.abs(px - qx) < 0.000001 * qx && Math.abs(py - qy) < 0.000001 * qy) {
    return false;
  }

  return true;
}

function setCursorMode(mode) {
  // detect current mode not completed prior to mode switch
  // if (true/*(cursorMode != mode) && (svgInProgress == cursorMode)*/) {        // iff switched mode while in progress
  //   svgInProgress = false;                                      // //////// does this ^ matter?
  if (thisElement) {
    checkLeftoverElement(); // look for dangling element, most likely off of svg image element ( - Y coord)

    clearEditElement(thisGroup); //  TODO: make sure all cases complete
  } // }


  if (mode.toUpperCase() == 'MOVE') {
    cursorMode = mode;
    console.log('@setCursorMode1 cursorMode = ' + cursorMode);
  } else {
    cursorMode = mode.toLowerCase();

    if (cursorMode == 'text') {//document.getElementById("text4svg").removeAttribute('disabled');
      //document.getElementById("text4svg").focus();        // this control eliminated
    }

    if (mode == 'rectangle') {
      // there are  few cases where the tagName of the element != cursorMode
      cursorMode = 'rect'; // also cubic and quadratic, whose tagName is path and draw which is polyline

      console.log('@setCursorMode2 cursorMode = ' + cursorMode);
    }

    if (mode == 'clear') {
      clearLastGroup();
      cursorMode = 'MOVE';
    }

    if (mode == 'reset') {
      zoom_trans(0, 0, baseZoom);
      cursorMode = 'MOVE';
    }
  } // cursorMode WILL BE set at this point


  savedCursorMode = 'MOVE'; ////////////// eliminated but reinstated

  if (cursorMode.toUpperCase() != 'MOVE') {
    waitElement = true;
    console.log('@setCursorMode3 waitElement = ' + cursorMode);
  }

  indicateMode(cursorMode);
  svgInProgress = false;
}

SVGDraw.prototype.setMode = function (mode) {
  setCursorMode(mode);
};

function checkLeftoverElement() {
  // this function is only called when svgInProgress is false (?)
  switch (cursorMode) {
    case 'polyline':
    case 'polygon':
      // this seems to ONLY delete the last point, so disabled pending better treatment
      //                    var thesePoints = thisElement.attributes['points'].value.trim();
      //                    var splitPoints = thesePoints.split(' ');
      //                    thesePoints = '';
      //                    for (k = 0; k < splitPoints.length - 2; k++) {
      //                        thesePoints += splitPoints[k] + ' ';
      //                    }
      //                    thisElement.attributes['points'].value = thesePoints;
      break;
    //                    var thesePoints = thisElement.attributes['points'].value;
    //                    var splitPoints = thesePoints.split(' ');
    //                    thesePoints = '';
    //                    for (k = 0; k < splitPoints.length - 2; k++) {
    //                        thesePoints += splitPoints[k] + ' ';
    //                    }
    //                    thisElement.attributes['points'].value = thesePoints;
    //                    break;

    case 'circle':
      if (thisElement == null) return;

      if (thisElement.attributes['cy'].value - thisElement.attributes['r'].value < 0 || // off svgLayer
      thisElement.attributes['r'].value < 2) // single click
        {
          clearLastGroup(); // this was a leftover
        }

      break;

    case 'ellipse':
      if (thisElement == null) return;

      if (thisElement.attributes['cy'].value - thisElement.attributes['ry'].value < 0) {
        clearLastGroup(); // this was a leftover
      }

      break;

    case 'rect':
      if (thisElement == null) return;

      if (thisElement.attributes['height'].value < 0) {
        clearLastGroup(); // this was a leftover
      }

      break;

    case 'line':
      if (thisElement.attributes['y2'].value < 0) {
        clearLastGroup(); // this was a leftover
      }

      break;

    case 'text':
      finishTextGroup();
      break;
  }
}

function clearLastGroup() {
  var xlt = document.getElementById("xlt");

  if (xlt.childElementCount > 1) {
    // don't remove the base image
    xlt.lastChild.remove();
  }
}

function clearThisGroup(group) {
  if (group) {
    group.remove();
  }
}

function inverseColor(color) {
  // color is required to be string as #RRGGBB hexadecimal
  var red = makeHex8(color.slice(1, 3));
  var grn = makeHex8(color.slice(3, 5));
  var blu = makeHex8(color.slice(5, 7));
  return '#' + red + grn + blu;
}

function makeHex8(colorSegment) {
  // colorSegment is 8 bit hex encoded string
  var izit = (parseInt('0X' + colorSegment) ^ 0xFF).toString(16);

  if (izit.length == 2) {
    return izit;
  }

  return '0' + izit;
}

function zoomIn() {
  //            var zoomDelta = 0.05;
  if (zoom < maxZoom) {
    // zoom of 1 is pixel-per-pixel on svgLayer
    var newZoom = zoom * (1.0 + zoomDelta);

    if (newZoom > maxZoom) {
      newZoom = maxZoom;
    }

    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoomOut() {
  //            var zoomDelta = 0.05;
  if (zoom > baseZoom / 3) {
    var newZoom = zoom / (1.0 + zoomDelta);
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoom_trans(x, y, factor) {
  var xlt = document.getElementById('xlt'); // DOM svg element g xlt

  var transform = 'translate(' + x.toString() + ', ' + y.toString() + ')scale(' + factor.toString() + ')';
  zoom = factor;
  xC = x;
  yC = y;
  xlt.attributes['transform'].value = transform;
  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
}

function updateSvgText(event) {
  // modified to eliminate mousetrap
  thisKey = event.key; // this attribute only works for FireFox

  var thisKeyCode = event.keyCode; //if (thisKey == undefined) {                   // undefined if not FireFox

  thisKey = lookUpKey(event); // consolidate

  if (thisElement == null) {
    // this can occur if <text> element just completed and no new one started
    if (thisKeyCode == 8) {
      // prevent Backspace from invoking BACK browser function
      event.preventDefault();
    }

    return false;
  }

  if (event.keyCode == 13 && event.shiftKey) {
    // terminate this text block chain on Shift-Enter
    // setElementMouseEnterLeave(thisGroup);
    // removeCursorFromSvgText();
    // closeSvgText();
    // checkLeftoverElement();
    finishTextGroup();
    return false;
  }

  var text4svgValue; // text4svg is string

  text4svgValue = text4svg.slice(0, text4svg.length - 1); // remove text cursor (underscore)

  if (thisKeyCode > 31) {
    // space or other printing character
    text4svg = text4svgValue + thisKey + '_';
  }

  if (thisKeyCode == 8) {
    text4svg = text4svgValue.slice(0, text4svgValue.length - 1) + '_';
    event.preventDefault(); // prevent Backspace from invoking BACK browser function
  }

  if (!thisKey && thisKeyCode != 13 && thisKeyCode != 8) {
    return;
  } // only pass printing keys, Delete, and Return/Enter


  thisElement.innerHTML = parseHTML(text4svg); // this needs to be pair-parsed into ' '&nbsp;

  thisElement.attributes['stroke'].value = cursorColor; // allow in-line whole line color/font/size over-ride

  thisElement.attributes['style'].value = 'font-family: ' + textFont + '; fill: ' + cursorColor + ';'; //  including fill

  thisElement.attributes['font-size'].value = textHeight;
  var nextX = thisElement.attributes['x'].value;
  var nextY = parseInt(thisElement.attributes['y'].value) + parseInt(textHeight);
  var nextLine = thisElement.cloneNode();

  if (event.keyCode == 13) {
    // line feed on ENTER/CR -- termination on shift-Enter/Return already picked off
    thisElement.innerHTML = parseHTML(text4svgValue.slice(0, text4svgValue.length)); // remove cursor at end of line
    //    var thisInverse = inverseColor(cursorColor);        // no longer used -- relocation bubble used now
    //    thisElement.attributes['onmouseover'] = 'this.attributes["stroke"].value = ' + thisInverse + ';';

    nextLine.attributes['x'].value = nextX;
    nextLine.attributes['y'].value = nextY;
    thisElement.parentElement.appendChild(nextLine);
    thisElement = nextLine;
    thisElement.innerHTML = '_';
    text4svg = '_';
    event.preventDefault();
  }
}

function parseHTML(spaceText) {
  // morphs multiple spaces in string to HTML equivalent
  var result = spaceText.replace(/  /g, ' &nbsp;'); // two consecutive spaces become space+nonbreakingspace

  result = result.replace(/</g, '&lt;').replace(/>/g, '&gt');
  return result;
}

function finishTextGroup() {
  // uses global variable thisGroup for <text>.parent
  // line/group is complete except for text cursor
  removeCursorFromSvgText(); // if thisElement is empty, it will disappear through this call

  if (!thisGroup) {
    return;
  }

  if (thisGroup.hasChildNodes()) {
    // thisGroup may contain more that one text element, one for each line
    setElementMouseEnterLeave(thisGroup); // if this group is to be persisted, set the mouse listeners for future edit
  } else {
    // if no child nodes, it is empty and should be
    thisGroup.remove(); // removed

    var BreakHere = true;
  }

  closeSvgText(); // checkLeftoverElement();         // //////////// does not consider <text> === useless

  thisGroup = null;
}

function removeCursorFromSvgText() {
  //   ///////////  does this do enough?
  if (!thisElement) {
    return;
  } // in case called again after end condition


  if (thisElement.parentElement) {
    // check valid element
    if (thisElement.parentElement.lastChild.innerHTML == '_') {
      // if ONLY underscore cursor
      thisElement.parentElement.lastChild.remove(); // remove the <text> element

      text4svg = '_'; // initialize for later

      thisElement = null; // kill the element
    } else {
      if (svgInProgress == 'text') {
        //   ///////////////  newly added stronger condition
        thisElement.innerHTML = parseHTML(text4svg.slice(0, text4svg.length - 1)); // remove cursor at end of line

        if (thisElement.innerHTML == '') {
          thisElement.remove();
          thisElement = null;
          var BreakHere = true;
        }

        if (thisGroup.lastChild.tagName == 'g') {
          // this is to detect a leftover bubble
          thisGroup.lastChild.remove; // clearEditElement(group);

          var _BreakHere = true;
        }
      }
    }
  }
}

function closeSvgText() {
  text4svg = '_';
  thisSVGpoints = []; // clear the container

  thisElement = null;
  svgInProgress = false;
}

function setCursorColor(color) {
  cursorColor = color;
  document.getElementById('cursorColor').attributes['style'].value = 'background-color: ' + cursorColor;
}

function setUserColor(color) {
  // only sets up the color for later selection
  var userColorCheckbox = document.getElementById('selectUserColor');
  userColorCheckbox.attributes['style'].value = 'background-color: ' + color;
  userColorCheckbox.blur();
}

function getUserColor() {
  return document.getElementById('userColor').value;
}

function indicateMode(mode) {
  var coverRect = mode;

  if (mode == 'rect') {
    coverRect = 'rectangle'; // replace anomalous rect with rectangle
  }

  document.getElementById("mode").textContent = coverRect.toUpperCase(); //            $("#zoom").html("Zoom:" + zoom.toFixed(3));

  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
}

function collectSVG(verbatim) {
  // verbatim true includes all markup, false means stripped
  var clonedSVG = svgLayer.cloneNode(true);
  var thisXLT = clonedSVG.firstChild;

  if (!verbatim) {
    clonedSVG.removeAttribute('height');
    clonedSVG.removeAttribute('width');
    clonedSVG.firstChild.attributes['transform'].value = 'translate(0, 0)scale(1)';
    thisXLT.children['xltImage'].remove();
  }

  var innerElement;
  var thisG;
  var terminus = thisXLT.childElementCount; // this will lety if we replace <g> elements when not "verbatim"

  var i;
  var j = 1; // this will be the indexer for <g> elements

  var k;

  for (i = 1; i < terminus; i++) {
    // i will range over the original children count
    thisG = thisXLT.childNodes[j]; // probably should be firstChild since iteratively
    // thisG.removeAttribute('onmouseenter');
    // thisG.removeAttribute('onmouseleave');

    j++; // index the next <g> in case we are verbatim-ish

    if (!verbatim) {
      // new wrinkle for arrow and similar groups
      if (thisG.attributes.class) {
        thisG.removeAttribute('id');
      } else {
        j--; // not verbatim, so back up to index the same <g>

        k = thisG.childElementCount; // save the number of children before it disappears

        innerElement = thisXLT.children[j].innerHTML; // make a copy of the primitive SVG <element>(s) inside the <g>

        thisXLT.children[j].outerHTML = innerElement; // replace the <g> with its content (e.g., may be multiple <text>s)

        j += k; // adjust the <g> indexer to take into account the added element(s)
      }
    }
  }

  if (!verbatim) {
    // disable the image if not verbatim
    innerElement = thisXLT.firstChild.outerHTML.replace('<image', '<!--image').replace('/image>', '/image-->');
    thisXLT.firstChild.outerHTML = innerElement; // this is done AFTER the other depopulation so accounting is easier
  }

  return clonedSVG; //  oops, this was too easy
}

;

SVGDraw.prototype.showSVG = function (verbatim) {
  svgMenu.children['textSVGorJSON'].textContent = collectSVG(verbatim).outerHTML;
};

SVGDraw.prototype.jsonSVG = function (verbatim) {
  // package SVG into JSON object
  var clonedSVG = collectSVG(false).firstChild; // strip off <svg...> </svg>

  clonedSVG.removeAttribute('id');
  clonedSVG.removeAttribute('transform'); // clonedSVG.childNodes[0].remove();    // this was originally the image, now removed if !verbatim

  var JSONsvg = {
    "data": {
      "type": "svg",
      "attributes": clonedSVG.outerHTML
    }
  };
  svgMenu.children['textSVGorJSON'].textContent = JSON.stringify(JSONsvg);
  return JSONsvg;
}; // buildSVGmenu refactored into standalone integrated function


SVGDraw.prototype.buildSVGmenu = function (containerID) {
  if (containerID.attributes['data-buttons']) {
    (function () {
      var buttons = JSON.parse(containerID.attributes['data-buttons'].value).buttons;
      svgMenu = document.createElement('div'); // this lengthy, tedious section generates the controls needed

      svgMenu.setAttribute('id', 'svgMenu');
      containerID.parentElement.appendChild(svgMenu);
      var thisButton, thisSpan, i;

      for (i = 0; i < buttons.length; i++) {
        // these buttons explicitly enumerated in data-buttons
        var thisFunction = buttons[i].function;
        var thisValue = buttons[i].value;

        (function () {
          switch (thisFunction) {
            case 'clear':
            case 'polygon':
            case 'polyline':
            case 'line':
            case 'arrow':
            case 'rectangle':
            case 'circle':
            case 'ellipse':
            case 'quadratic':
            case 'cubic':
            case 'draw':
            case 'text':
            case 'MOVE':
            case 'reset':
              thisButton = document.createElement('input');
              thisButton.setAttribute('type', 'button');

              if (thisValue) {
                thisButton.setAttribute('value', thisValue);
              } else {
                thisButton.setAttribute('value', buttons[i].function.charAt(0).toUpperCase() + buttons[i].function.slice(1));
              }

              thisButton.setAttribute('id', 'b_' + buttons[i].function.toLowerCase());
              svgMenu.appendChild(thisButton);
              var thisMode = buttons[i].function;
              thisButton.addEventListener('click', function (event) {
                setCursorMode(thisMode);
              });
              break;

            case 'mode':
              thisSpan = document.createElement('span'); // mode/status display area

              thisSpan.setAttribute('id', 'mode');
              svgMenu.appendChild(thisSpan);
              break;

            case 'zoomin':
              thisButton = document.createElement('input'); // default ZOOM OUT button

              thisButton.setAttribute('type', 'button');
              thisButton.setAttribute('value', 'Zoom IN');
              thisButton.setAttribute('id', 'b_zoomin');
              svgMenu.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                thisButton.blur();
                zoomIn();
              });
              break;

            case 'zoom':
              thisButton = document.createElement('span'); // ZOOM display area

              thisButton.setAttribute('id', 'zoom');
              thisButton.setAttribute('innerHTML', ' Zoom:  ----');
              svgMenu.appendChild(thisButton);
              break;

            case 'zoomout':
              thisButton = document.createElement('input'); // default ZOOM OUT button

              thisButton.setAttribute('type', 'button');
              thisButton.setAttribute('value', 'Zoom OUT');
              thisButton.setAttribute('id', 'b_zoomout');
              svgMenu.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                thisButton.blur();
                zoomOut();
              });
              break;

            case 'textheight':
              thisSpan = document.createElement('span'); // TEXT display area

              thisSpan.setAttribute('id', 'textBlock'); //thisSpan.textContent = 'Text Size: ';

              svgMenu.appendChild(thisSpan);
              var thistextHeightTitle = document.createElement('span');
              thistextHeightTitle.innerHTML = ' Text Size: ';
              thisSpan.appendChild(thistextHeightTitle);
              thisButton = document.createElement('input'); // default TEXT SIZE input

              thisButton.setAttribute('id', 'textHeight');
              thisButton.setAttribute('type', 'number');
              thisButton.setAttribute('min', '5');
              thisButton.setAttribute('step', '5');
              thisButton.setAttribute('max', '300');
              thisButton.setAttribute('style', 'width: 4em');
              thisButton.setAttribute('value', '75'); // thisButton.setAttribute('onchange', 'textHeight=this.value; this.blur();');

              thisSpan.appendChild(thisButton); // thisButton.addEventListener('change', (event) => { textHeight = thisButton.value; thisButton.blur(); })

              thisButton.addEventListener('change', function (event) {
                setTextHeight();
              });
              break;

            case 'newline':
              svgMenu.appendChild(document.createElement('br'));
              thisSpan = document.createElement('span');
              thisSpan.innerHTML = 'Select color: ';
              svgMenu.appendChild(thisSpan);
              break;

            case 'colorselect':
              var colorSelect = {
                "buttons": [// select this color buttons: Red/Green/Blue/Black/UserDefined/Selected
                {
                  "color": "#FF0000"
                }, {
                  "color": "#00FF00"
                }, {
                  "color": "#0000FF"
                }, {
                  "color": "#000000"
                }, {
                  "color": "#666666"
                }, {
                  "color": "#FF0000"
                }]
              };
              var j = void 0;

              for (j = 0; j < colorSelect.buttons.length; j++) {
                // buttons explicitly enumerated in data-buttons
                if (j == 4) {
                  // insert the text area input after the first 4 color select buttons
                  thisButton = document.createElement('input');
                  thisButton.setAttribute('id', 'userColor');
                  thisButton.setAttribute('type', 'text');
                  thisButton.setAttribute('value', colorSelect.buttons[j].color);
                  thisButton.setAttribute('style', 'width: 5em'); // thisButton.setAttribute('onchange', "setUserColor(this.value); this.blur();");

                  svgMenu.appendChild(thisButton);
                  thisButton.addEventListener('change', function (event) {
                    setUserColor(getUserColor());
                    thisButton.blur();
                  });
                  thisButton = document.createElement('input'); // add the user-defined color select button

                  thisButton.setAttribute('id', 'selectUserColor');
                  thisButton.setAttribute('type', 'button');
                  thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color); // thisButton.setAttribute('onclick', "setCursorColor(getUserColor()); this.blur();");

                  svgMenu.appendChild(thisButton);
                  thisButton.addEventListener('click', function (event) {
                    setCursorColor(getUserColor());
                    thisButton.blur();
                  });
                }

                if (j < colorSelect.buttons.length - 2) {
                  (function () {
                    // for the first four (0:3) color select buttons, just set table color
                    thisButton = document.createElement('input');
                    thisButton.setAttribute('type', 'button');
                    thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color); // thisButton.setAttribute('onclick', "setCursorColor('" + colorSelect.buttons[j].color + "'); this.blur();");

                    svgMenu.appendChild(thisButton);
                    var thisColor = colorSelect.buttons[j].color;
                    thisButton.addEventListener('click', function (event) {
                      setCursorColor(thisColor);
                      thisButton.blur();
                    });
                  })();
                }

                if (j > colorSelect.buttons.length - 2) {
                  // insert the selected color block (5) (indicator only) as last
                  var thisColorTitle = document.createElement('span');
                  thisColorTitle.innerHTML = ' Selected Color >';
                  svgMenu.appendChild(thisColorTitle);
                  thisButton = document.createElement('input');
                  thisButton.setAttribute('id', 'cursorColor');
                  thisButton.setAttribute('type', 'button'); // thisButton.setAttribute('style', 'this.blur(); background-color: ' + colorSelect.buttons[j].color);

                  thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color);
                  svgMenu.appendChild(thisButton); // let thisColor = colorSelect.buttons[j].color;
                  // thisButton.addEventListener('click', (event) => { setUserColor(thisColor); this.blur(); });

                  cursorColor = colorSelect.buttons[j].color; // set the cursorColor from the nominal button arrangement
                }
              }

              break;

            case 'arrowspecs':
              thisSpan = document.createElement('span'); // arrow display area

              thisSpan.setAttribute('id', 'arrowBlock');
              thisSpan.innerHTML += ' &nbsp;Arrowhead: Closed:';
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'arrowHeadClosed');
              thisButton.setAttribute('type', 'checkbox'); // thisButton.setAttribute('onclick', "this.blur();");

              thisSpan.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                // thisButton.blur();
                arrowClosed = document.getElementById('arrowHeadClosed').checked;
              });
              thisSpan.innerHTML += ' &nbsp; Fixed:';
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'arrowHeadPixels');
              thisButton.setAttribute('type', 'checkbox'); // thisButton.setAttribute('onclick', "this.blur();");

              thisSpan.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                // thisButton.blur();
                arrowFixed = document.getElementById('arrowHeadPixels').checked;
              });
              thisSpan.innerHTML += ' &nbsp; Length:';
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'arrowHeadLength');
              thisButton.setAttribute('type', 'number');
              thisButton.setAttribute('value', '50'); // thisButton.setAttribute('min', '5');
              // thisButton.setAttribute('step', '10');
              // thisButton.setAttribute('max', '150');

              thisButton.setAttribute('style', 'width: 4em'); // thisButton.setAttribute('onchange', 'this.blur();');

              thisSpan.appendChild(thisButton);
              thisButton.addEventListener('change', function (event) {
                // thisButton.blur();
                // arrowheadLength = parseFloat(document.getElementById('arrowHeadLength').value)
                SVGDraw.prototype.apiArrowLength();
              });
              thisSpan.innerHTML += ' &nbsp; Percent:';
              thisButton = document.createElement('input'); // default TEXT SIZE input

              thisButton.setAttribute('id', 'arrowHeadPercent');
              thisButton.setAttribute('type', 'number');
              thisButton.setAttribute('min', '5');
              thisButton.setAttribute('step', '1');
              thisButton.setAttribute('max', '30');
              thisButton.setAttribute('style', 'width: 4em');
              thisButton.setAttribute('value', '10');
              thisSpan.appendChild(thisButton);
              thisSpan.addEventListener('change', function (event) {
                thisButton.blur();
                arrowPercent = parseFloat(document.getElementById('arrowHeadPercent').value);
              });
              svgMenu.appendChild(thisSpan);
              break;

            case 'json':
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'saveSVG');
              thisButton.setAttribute('type', 'button');
              thisButton.setAttribute('value', 'Extract SVG'); // thisButton.setAttribute('onclick', 'this.blur(); showSVG(true);');

              svgMenu.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                thisButton.blur();
                SVGDraw.prototype.showSVG(true);
              });
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'plainSVG');
              thisButton.setAttribute('type', 'button');
              thisButton.setAttribute('value', 'Plain SVG'); // thisButton.setAttribute('onclick', 'this.blur(); showSVG(false);');
              // thisButton.setAttribute('onclick', 'showSVG(false);');

              svgMenu.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                thisButton.blur();
                SVGDraw.prototype.showSVG(false);
              });
              thisButton = document.createElement('input');
              thisButton.setAttribute('id', 'svgJSON');
              thisButton.setAttribute('type', 'button');
              thisButton.setAttribute('value', 'JSON SVG');
              svgMenu.appendChild(thisButton);
              thisButton.addEventListener('click', function (event) {
                SVGDraw.prototype.jsonSVG(false);
              });
              svgMenu.appendChild(document.createElement('br'));
              var thisTextArea = document.createElement('textarea');
              thisTextArea.setAttribute('id', 'textSVGorJSON');
              svgMenu.appendChild(thisTextArea);
              break;
          }
        })();
      }
    })();
  }
};

function setTextHeight() {
  textHeight = document.getElementById('textHeight').value;
}

SVGDraw.prototype.apiTextHeight = function (height) {
  if (isNumeric(height)) textHeight = height;
};

SVGDraw.prototype.apiArrowClosed = function (checked) {
  arrowClosed = checked;
};

SVGDraw.prototype.apiArrowFixed = function (checked) {
  arrowFixed = checked;
};

SVGDraw.prototype.apiArrowLength = function (length) {
  if (length) {
    if (isNumeric(length)) {
      arrowheadLength = length;
    }
  } else {
    arrowheadLength = parseFloat(document.getElementById('arrowHeadLemgth').value);
  }
};

SVGDraw.prototype.apiArrowPercent = function (percent) {
  if (isNumeric(percent)) arrowPercent = percent;
};

/* harmony default export */ var svg_detailer = (SVGDraw);
// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/entry-lib.js


/* harmony default export */ var entry_lib = __webpack_exports__["default"] = (svg_detailer);



/***/ }),

/***/ "fdef":
/***/ (function(module, exports) {

module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';


/***/ })

/******/ });
//# sourceMappingURL=svg-detailer.common.js.map