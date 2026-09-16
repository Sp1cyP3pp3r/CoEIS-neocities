$(function () {
  const selector = ".point-container input[type='checkbox']";

  function setState(box, state) {
    $(box).attr("data-state", state);

    switch (state) {
      case "checked":
        box.checked = true;
        box.indeterminate = false;
        break;

      case "indeterminate":
        box.checked = false;
        box.indeterminate = true;
        break;

      case "unchecked":
      case "off-limit":
        box.checked = false;
        box.indeterminate = false;
        break;
    }
  }

  function getBoxes(box) {
    return $(box).closest(".point-container").find("input[type='checkbox']");
  }

  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  $(document).on("mousedown", selector, function (e) {
    e.preventDefault();

    const $boxes = getBoxes(this);
    const index = $boxes.index(this);
    const state = $(this).attr("data-state");

    if (e.button === 0) {
      if (state === "off-limit") {
        return;
      }

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }

      if (state === "checked") {
        $boxes.slice(index).each(function () {
          const currentState = $(this).attr("data-state");

          if (currentState === "off-limit") {
            return false;
          }

          if (currentState === "checked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      if (state === "indeterminate") {
        setState(this, "checked");

        $boxes.slice(0, index).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }
    }

    if (e.button === 1) {
      if (state === "off-limit") {
        return;
      }

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          if ($(this).attr("data-state") === "unchecked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      if (state === "checked") {
        $boxes.slice(index).each(function () {
          const currentState = $(this).attr("data-state");

          if (currentState === "off-limit") {
            return false;
          }

          if (currentState === "checked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      if (state === "indeterminate") {
        const $right = $boxes.slice(index + 1);

        const hasIndeterminateRight =
          $right.filter(function () {
            return $(this).attr("data-state") === "indeterminate";
          }).length > 0;

        if (hasIndeterminateRight) {
          $right.each(function () {
            const rightState = $(this).attr("data-state");

            if (rightState === "off-limit") {
              return false;
            }

            if (rightState === "indeterminate") {
              setState(this, "unchecked");
            }
          });
        } else {
          setState(this, "unchecked");
        }

        return;
      }
    }

    if (e.button === 2) {
      if (state === "off-limit") {
        if (
          index > 0 &&
          $boxes.eq(index - 1).attr("data-state") === "off-limit"
        ) {
          for (let i = index - 1; i >= 0; i--) {
            if ($boxes.eq(i).attr("data-state") !== "off-limit") {
              break;
            }

            setState($boxes[i], "unchecked");
          }
        } else {
          setState(this, "unchecked");
        }

        return;
      }

      $boxes.slice(index).each(function () {
        setState(this, "off-limit");
      });

      return;
    }
  });

  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();
  });

  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
