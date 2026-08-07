$(function () {
  $(document).on("change", ".point-container .point-checkbox", function () {
    const $container = $(this).closest(".point-container");
    const $checkboxes = $container.find(".point-checkbox");
    const index = $checkboxes.index(this);

    if (this.checked) {
      // Clicked an UNCHECKED box → fill left (including current), clear right
      $checkboxes.slice(0, index + 1).prop("checked", true);
      $checkboxes.slice(index + 1).prop("checked", false);
    } else {
      // Clicked a CHECKED box (browser already unchecked it)
      const hasCheckedAfter =
        $checkboxes.slice(index + 1).filter(":checked").length > 0;

      if (hasCheckedAfter) {
        // There are checked boxes after → re-check the clicked box, uncheck only after
        $checkboxes.eq(index).prop("checked", true);
        $checkboxes.slice(index + 1).prop("checked", false);
      }
      // else: no checked boxes after → browser already unchecked it, do nothing
    }

    // Update .point-total
    const totalCount = $container.find(".point-checkbox:checked").length;
    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");
    $total.text(totalCount);
  });
});

/* LIGHT & HEAVY DAMAGE FORMATING */
$(function () {
  const $inputs = $("#light-damage-input, #heavy-damage-input");

  $inputs.each(function () {
    const $input = $(this);

    // Clear previous input before entering new number
    $input.on("focus", function () {
      $(this).select();
    });

    $input.on("input", function () {
      let value = $(this).val();

      // Delete spaces and any non-digit characters
      value = value.replace(/\D/g, "");

      // Trim 0 in the front ("05" -> "5", but leaves a single "0" alone)
      value = value.replace(/^0+(?=\d)/, "");

      // Prevent completely empty input while typing
      if (value === "") value = "0";

      $(this).val(value);
    });

    // Default to 0 if cleared on blur
    $input.on("blur", function () {
      if ($(this).val().trim() === "") {
        $(this).val("0");
      }
    });
  });
});
(function ($) {
  $(function () {
    const $lightBlock = $("#light-damage");
    const $heavyBlock = $("#heavy-damage");

    function parseNumber(value) {
      const parsed = parseInt(String(value || "").replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function getMax($block) {
      return Math.max(
        0,
        parseNumber($block.find(".damage-max").first().text()),
      );
    }

    function getInputValue($block) {
      return parseNumber($block.find(".damage-input").val());
    }

    function clampValue(value, max) {
      value = Math.max(0, parseNumber(value));
      return max <= 0 ? 0 : Math.min(value, max);
    }

    function renderCheckboxes($block, value) {
      const max = getMax($block);
      const safeValue = clampValue(value, max);

      $block.find(".damage-checkbox").prop("checked", function () {
        return Number($(this).data("value")) <= safeValue;
      });
    }

    function setInputValue($block, value) {
      $block.find(".damage-input").val(value);
      renderCheckboxes($block, value);
    }

    function buildCheckboxes($block) {
      const max = getMax($block);
      const current = getInputValue($block);
      const $points = $block.find(".damage-points").empty();

      for (let i = 1; i <= max; i++) {
        $("<input>", {
          type: "checkbox",
          class: "point-checkbox damage-checkbox",
          "data-value": i,
        }).appendTo($points);
      }

      renderCheckboxes($block, current);
    }

    function sanitizeInput($input) {
      const clean = String($input.val() || "").replace(/[^0-9]/g, "");

      if (clean !== $input.val()) {
        $input.val(clean);
      }

      return clean;
    }

    function setHeavyValue(value) {
      const heavyMax = getMax($heavyBlock);
      value = clampValue(value, heavyMax);

      setInputValue($heavyBlock, value);

      return value;
    }

    function commitLightValue(value) {
      const lightMax = getMax($lightBlock);

      value = Math.max(0, parseNumber(value));

      let carry = 0;
      let newLight = 0;

      if (lightMax > 0) {
        carry = Math.floor(value / lightMax);
        newLight = value % lightMax;
      }

      if (carry > 0) {
        const currentHeavy = getInputValue($heavyBlock);
        setHeavyValue(currentHeavy + carry);
      }

      setInputValue($lightBlock, newLight);

      return newLight;
    }

    function buildAllDamageCheckboxes() {
      buildCheckboxes($lightBlock);
      buildCheckboxes($heavyBlock);
    }

    /* Light input */

    $(document).on("input", "#light-damage .damage-input", function () {
      sanitizeInput($(this));
      renderCheckboxes($lightBlock, getInputValue($lightBlock));
    });

    $(document).on("keydown", "#light-damage .damage-input", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        commitLightValue(getInputValue($lightBlock));
      }
    });

    $(document).on("blur", "#light-damage .damage-input", function () {
      commitLightValue(getInputValue($lightBlock));
    });

    /* Heavy input */

    $(document).on("input", "#heavy-damage .damage-input", function () {
      sanitizeInput($(this));
      renderCheckboxes($heavyBlock, getInputValue($heavyBlock));
    });

    $(document).on("keydown", "#heavy-damage .damage-input", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        setHeavyValue(getInputValue($heavyBlock));
      }
    });

    $(document).on("blur", "#heavy-damage .damage-input", function () {
      setHeavyValue(getInputValue($heavyBlock));
    });

    /* Light checkboxes */

    $(document).on("change", "#light-damage .damage-checkbox", function () {
      const $box = $(this);
      const clickedValue = Number($box.data("value"));

      const value = $box.prop("checked") ? clickedValue : clickedValue - 1;

      commitLightValue(value);
    });

    /* Heavy checkboxes */

    $(document).on("change", "#heavy-damage .damage-checkbox", function () {
      const $box = $(this);
      const clickedValue = Number($box.data("value"));

      const value = $box.prop("checked") ? clickedValue : clickedValue - 1;

      setHeavyValue(value);
    });

    /* Watch max changes */

    const damageMaxObserver = new MutationObserver(function (mutations) {
      const blocksToUpdate = new Set();

      mutations.forEach(function (mutation) {
        const node = mutation.target;

        const element =
          node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

        const $max = $(element).closest(".damage-max");

        if ($max.length) {
          const block = $max.closest(".damage-block")[0];

          if (block) {
            blocksToUpdate.add(block);
          }
        }
      });

      blocksToUpdate.forEach(function (block) {
        const $block = $(block);

        buildCheckboxes($block);

        if ($block.attr("id") === "light-damage") {
          commitLightValue(getInputValue($lightBlock));
        } else {
          setHeavyValue(getInputValue($heavyBlock));
        }
      });
    });

    $("#fight-damage .damage-max").each(function () {
      damageMaxObserver.observe(this, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    window.STM = window.STM || {};

    window.STM.setDamageMax = function (damageType, newMax) {
      const $block = $("#fight-damage #" + damageType + "-damage");

      if (!$block.length) {
        return;
      }

      newMax = Math.max(0, parseNumber(newMax));

      $block.find(".damage-max").text(newMax);

      if (!("MutationObserver" in window)) {
        buildCheckboxes($block);

        if (damageType === "light") {
          commitLightValue(getInputValue($lightBlock));
        } else {
          setHeavyValue(getInputValue($heavyBlock));
        }
      }
    };

    /* Initial render */

    buildAllDamageCheckboxes();

    commitLightValue(getInputValue($lightBlock));
    setHeavyValue(getInputValue($heavyBlock));
  });
})(jQuery);
