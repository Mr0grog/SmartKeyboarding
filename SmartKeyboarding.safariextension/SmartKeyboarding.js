/**
 * Injected code for handing key events in web pages.
 **/

(function() {

var charactersFollowedByOpenQuote = /[\s({\[<\u2039\u00ab\u27e8\u27ea\u2768\u276e\u3014\u3010\u3016\u276a\u2774\u2772\u276c\u23a7\u23a1\u239b\u23a8\u23a3\u239d\u23a9]/;

// On keypress, see if we need to place something special
document.addEventListener('keypress', function(event) {
  var element = event.target;
  
  // Bail out if not in a text editing area.
  if (!isAcceptableTarget(element)) {
    return;
  }
  
  var ctrl = event.ctrlKey;
  var shift = event.shiftKey;
  var character = String.fromCharCode(event.charCode);
  var replacement = null;
  var backspace = 0;
  var priorText = getText(element)[getSelectionIndex(element) - 1];
  
  // single quote smart quotes
  if (character === "'") {
    // If the ctrl key is pressed, we get a ' char instead of ", even if shift is down
    // which means we need to manually put in the right thing if shift is down
    if (ctrl && shift) {
      replacement = "\"";
    }
    else if (ctrl) {
      replacement = "'";
    }
    else {
      var openQuote = !priorText || charactersFollowedByOpenQuote.test(priorText);
      replacement = openQuote ? "‘" : "’";
    }
  }
  // double quote smart quotes
  else if (character === "\"") {
    var openQuote = !priorText || charactersFollowedByOpenQuote.test(priorText);
    replacement = openQuote ? "“" : "”";
  }
  // ellipsis on the third period
  else if (character === ".") {
    var index = getSelectionIndex(element);
    if (index >= 2 && getText(element).slice(index - 2, index) === "..") {
      replacement = ctrl ? "." : "…";
      backspace = 2;
    }
  }
  // em dashes for double hyphens
  else if (character === "-") {
    var index = getSelectionIndex(element);
    if (index >= 1 && getText(element).slice(index - 1, index) === "-") {
      replacement = ctrl ? "-" : "—";
      backspace = 1;
    }
  }
  // default behavior for `ctrl+-` is to do nothing, but we want that to
  // insert a normal dash and not do the above em-dash behavior.
  // Also: no clue why ctrl+- gets us an "information separator" char.
  else if (event.charCode === 31 && ctrl && !shift) {
    replacement = "-";
  }
  
  if (replacement) {
    event.preventDefault();
    insertText(replacement, backspace);
  }
}, false);

function getText(element) {
  if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
    return element.value;
  }
  else if (element.isContentEditable) {
    return document.activeElement.textContent;
  }
  else {
    return "";
  }
}

function getSelectionIndex(element) {
  if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
    return element.selectionStart;
  }
  else if (element.isContentEditable) {
    var range = window.getSelection().getRangeAt(0);
    range.collapse(true);
    range.setStart(document.activeElement, 0);
    return range.toString().length;
  }
  else {
    return 0;
  }
}

function insertText(newText, charactersToRemove) {
  charactersToRemove = charactersToRemove || 0;
  
  var element = document.activeElement;
  
  if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
    var oldValue = element.value;
    var selectionStart = element.selectionStart;
    var selectionEnd = element.selectionEnd;
    var newValue =
      oldValue.slice(0, selectionStart - charactersToRemove) +
      newText +
      oldValue.slice(selectionEnd);
    
    element.value = newValue;
    element.setSelectionRange(selectionStart + 1, selectionStart + 1);
  }
  else if (element.isContentEditable) {
    // NOTE: we are kind of assuming a selection will be present.
    // It *should* be, since this will only get called while typing,
    // but this is definitely a potential spot for an error.
    var selection = window.getSelection();
    
    // if we are going to delete characters (e.g. the first hyphen in a
    // double-hyphen), select them.
    if (charactersToRemove) {
      // Because *selection.modify()* moves the focus and not the anchor,
      // we have to make sure the selection is backward (the focus should
      // be at the start)
      var range = selection.getRangeAt(0);
      // *end* is the end, regardless of whether that's the focus or anchor
      selection.collapseToEnd();
      selection.extend(range.startContainer, range.startOffset);
      for (var i = charactersToRemove; i > 0; i--) {
        selection.modify("extend", "backward", "character");
      }
    }
    
    // Same concern as above; the selection *could* have no ranges.
    var range = selection.getRangeAt(0);
    if (range.toString().length) {
      selection.deleteFromDocument();
    }
    // Place new text at the cursor
    var newTextNode = document.createTextNode(newText);
    range.insertNode(newTextNode);
    
    // ...and update the selection
    range.selectNode(newTextNode);
    range.collapse(false);
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function isAcceptableTarget(target) {
  return target.nodeName === "INPUT" ||
    target.nodeName === "TEXTAREA" ||
    target.isContentEditable;
}


})();
