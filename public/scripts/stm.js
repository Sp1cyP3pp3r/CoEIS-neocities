$(function () {
  // ===============================================================
  // SELECTOR
  // ===============================================================

  const selector = ".point-container input[type='checkbox']";

  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================

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

  // ===============================================================
  // PREVENT NATIVE CHECKBOX BEHAVIOR
  // ===============================================================

  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MOUSE INPUT
  // ===============================================================

  $(document).on("mousedown", selector, function (e) {
    e.preventDefault();

    const $boxes = getBoxes(this);
    const index = $boxes.index(this);
    const state = $(this).attr("data-state");

    // =============================================================
    // LEFT MOUSE BUTTON
    // =============================================================

    if (e.button === 0) {
      // OFF-LIMIT

      if (state === "off-limit") {
        return;
      }

      // UNCHECKED → CHECKED

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }

      // CHECKED → CORRECT BEHAVIOR

      if (state === "checked") {
        // Check if there is any checked box to the right (before off-limit)
        let hasCheckedRight = false;
        for (let i = index + 1; i < $boxes.length; i++) {
          const s = $boxes.eq(i).attr("data-state");
          if (s === "off-limit") break;
          if (s === "checked") {
            hasCheckedRight = true;
            break;
          }
        }

        if (!hasCheckedRight) {
          // This is the last checked box.
          // Find the last indeterminate box to the right (before off-limit)
          let lastIIndex = -1;
          for (let i = index + 1; i < $boxes.length; i++) {
            const s = $boxes.eq(i).attr("data-state");
            if (s === "off-limit") break;
            if (s === "indeterminate") {
              lastIIndex = i;
            }
          }
          if (lastIIndex !== -1) {
            // Shift indeterminate left: this becomes indeterminate, last indeterminate becomes unchecked.
            setState(this, "indeterminate");
            setState($boxes[lastIIndex], "unchecked");
          } else {
            // No indeterminate to the right, just uncheck this box.
            setState(this, "unchecked");
          }
        } else {
          // There is a checked box to the right.
          // The clicked box stays checked.
          // Count total indeterminate boxes in the active area (before off-limit).
          let numI = 0;
          for (let i = 0; i < $boxes.length; i++) {
            const s = $boxes.eq(i).attr("data-state");
            if (s === "off-limit") break;
            if (s === "indeterminate") numI++;
          }
          // Set all boxes after index up to index+numI to indeterminate, and the rest to unchecked.
          let i = index + 1;
          let iCount = 0;
          while (i < $boxes.length) {
            const s = $boxes.eq(i).attr("data-state");
            if (s === "off-limit") break;
            if (iCount < numI) {
              setState($boxes[i], "indeterminate");
              iCount++;
            } else {
              setState($boxes[i], "unchecked");
            }
            i++;
          }
        }

        return;
      }

      // INDETERMINATE → CHECKED

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

    // =============================================================
    // MIDDLE MOUSE BUTTON
    // =============================================================

    if (e.button === 1) {
      // OFF-LIMIT

      if (state === "off-limit") {
        return;
      }

      // UNCHECKED → INDETERMINATE

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

      // CHECKED → INDETERMINATE

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

      // INDETERMINATE → UNCHECKED

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

    // =============================================================
    // RIGHT MOUSE BUTTON
    // =============================================================

    if (e.button === 2) {
      // OFF-LIMIT → REMOVE PREVIOUS OFF-LIMIT POINTS

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

      // SET OFF-LIMIT FROM CURRENT POINT

      $boxes.slice(index).each(function () {
        setState(this, "off-limit");
      });

      return;
    }
  });

  // ===============================================================
  // CONTEXT MENU
  // ===============================================================

  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MIDDLE-CLICK AUXILIARY EVENT
  // ===============================================================

  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});

$(document).ready(function () {
  // Check if the current hostname is localhost or 127.0.0.1
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // Target the existing favicon link element
    let $favicon = $('link[rel*="icon"]');
    let localFaviconUrl = "/assets/icon_localhost.png"; // Path to your local environment favicon

    if ($favicon.length) {
      // Update the href if the element already exists
      $favicon.attr("href", localFaviconUrl);
    } else {
      // Create and append a new link element if none exists
      $("head").append(
        '<link rel="shortcut icon" href="' +
          localFaviconUrl +
          '" type="image/x-icon" />',
      );
    }
  }
});
