$(function () {
  const selector = ".point-container input[type='checkbox']";

  // Prevent the browser's native checkbox behavior.
  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  // =============================================================
  // LEFT + MIDDLE CLICK
  // =============================================================
  $(document).on("mousedown", selector, function (e) {
    if (e.button !== 0 && e.button !== 1) return;

    e.preventDefault();
    e.stopPropagation();

    const $container = $(this).closest(".point-container");
    const $boxes = $container.find(selector);
    const index = $boxes.index(this);

    // -----------------------------------------------------------
    // LEFT CLICK
    // -----------------------------------------------------------
    if (e.button === 0) {
      // LMB on INDETERMINATE:
      // this becomes checked, indeterminate boxes to the right
      // remain untouched.
      if (this.indeterminate) {
        this.checked = true;
        this.indeterminate = false;

        $boxes.slice(0, index).each(function () {
          if (!this.disabled) {
            this.checked = true;
            this.indeterminate = false;
          }
        });

        return;
      }

      // LMB on CHECKED:
      // if there is an indeterminate region to the right,
      // the boxes that would normally become unchecked instead
      // become indeterminate.
      if (this.checked) {
        const hasIndeterminateRight = $boxes
          .slice(index + 1)
          .toArray()
          .some((box) => box.indeterminate);

        $boxes.slice(index + 1).each(function () {
          if (this.disabled) return;

          this.checked = false;
          this.indeterminate = hasIndeterminateRight;
        });

        return;
      }

      // LMB on UNCHECKED:
      // fill everything from the left through this box.
      $boxes.slice(0, index + 1).each(function () {
        if (this.disabled) return;

        this.checked = true;
        this.indeterminate = false;
      });

      return;
    }

    // -----------------------------------------------------------
    // MIDDLE CLICK
    // -----------------------------------------------------------
    if (e.button === 1) {
      // MMB on CHECKED:
      // this box and checked boxes to its right become indeterminate.
      if (this.checked && !this.indeterminate) {
        $boxes.slice(index).each(function () {
          if (this.disabled) return;

          if (this.checked) {
            this.checked = false;
            this.indeterminate = true;
          }
        });

        return;
      }

      // MMB on INDETERMINATE:
      // leave it alone.
      if (this.indeterminate) {
        return;
      }

      // MMB on UNCHECKED:
      // unchecked boxes to the left become indeterminate.
      $boxes.slice(0, index + 1).each(function () {
        if (this.disabled) return;

        if (!this.checked) {
          this.indeterminate = true;
        }
      });
    }
  });

  // =============================================================
  // RIGHT CLICK
  //
  // Listen on the CONTAINER, because disabled checkboxes don't
  // receive mouse events.
  // =============================================================
  $(document).on("contextmenu", ".point-container", function (e) {
    e.preventDefault();

    // Find the checkbox currently under the cursor.
    const element = document.elementFromPoint(e.clientX, e.clientY);

    if (!element || !element.matches(selector)) {
      return;
    }

    const $boxes = $(this).find(selector);
    const index = $boxes.index(element);

    if (index === -1) return;

    // Disable this box and everything to its right.
    $boxes.slice(index).each(function () {
      this.checked = false;
      this.indeterminate = false;
      this.disabled = true;
    });
  });

  // =============================================================
  // MIDDLE CLICK: prevent auxclick behavior
  // =============================================================
  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
