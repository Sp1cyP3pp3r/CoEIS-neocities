$(function() {
    const $window = $(window), $aside = $('aside'), scrollFactor = 0.4;

    $window.on('wheel', function(e) {
        const delta = e.originalEvent.deltaY;
        let target = null;

        const winTop = $window.scrollTop(), winBottom = winTop + $window.height(), docHeight = $(document).height();
        const asideTop = $aside.scrollTop(), asideBottom = asideTop + $aside.outerHeight(), asideHeight = $aside[0].scrollHeight;

        if (delta > 0) target = (winBottom >= docHeight - 1) ? $aside : (asideBottom >= asideHeight - 1) ? $window : null;
        else if (delta < 0) target = (winTop <= 0) ? $aside : (asideTop <= 0) ? $window : null;

        if (target) e.preventDefault(), target.scrollTop(target.scrollTop() + delta * scrollFactor);
    });
});
