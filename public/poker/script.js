const cardPerspectiveShift = 20;

$(document).ready(function() {
    cardHover();
});

function cardHover() {
    $('game-card').each(function() {
        const card = this;

        $(card).on("mousemove", function(event) {
            const cardRect = card.getBoundingClientRect();
            
            const mouseX = event.clientX - cardRect.left - cardRect.width / 2;
            const mouseY = event.clientY - cardRect.top - cardRect.height / 2;

            const rotateY = (mouseX / cardRect.width) * cardPerspectiveShift * 1;
            const rotateX = (mouseY / cardRect.height) * cardPerspectiveShift * -1;

            const offsetX = mouseX - cardRect.width / 2;
            const offsetY = mouseY - cardRect.height / 2;

            card.style.setProperty('--rotateX', `${rotateX}deg`);
            card.style.setProperty('--rotateY', `${rotateY}deg`);

            card.style.setProperty('--card-ed-fg-pos-x', `${offsetX}px`);
            card.style.setProperty('--card-ed-fg-pos-y', `${offsetY}px`);
        });
        
        $(card).on("mouseleave", function() {
            card.style.setProperty('--rotateX', '0deg');
            card.style.setProperty('--rotateY', '0deg');
            card.style.setProperty('--card-ed-fg-pos-x', `25%`);
            card.style.setProperty('--card-ed-fg-pos-y', `25%`);
        });
    });
}