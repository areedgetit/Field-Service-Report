document.querySelectorAll('textarea').forEach(function(node) {
    node.style.width = '194px'; // Fixed width
    node.style.overflow = 'hidden'; // Prevent overflow

    node.oninput = function() {
        node.style.height = 'auto'; // Reset height to auto to measure scrollHeight
        node.style.height = (node.scrollHeight) + 'px'; // Set height to scrollHeight
    };

    // Initial height adjustment
    node.style.height = (node.scrollHeight) + 'px';
});
