document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');
  const inputDivs = document.querySelectorAll('.input-div');

  // ... (keep your existing CSS and event listener setup) ...

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and contenteditable elements
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = form.offsetWidth + 'px';
    tempContainer.style.visibility = 'hidden';

    // Clone the form and append it to the temporary container
    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    // Function to generate PDF
    function generatePDF() {
      // Get the full height of the form, including any expanded content
      const formHeight = tempContainer.scrollHeight;
      const formWidth = tempContainer.offsetWidth;

      // Add a small buffer to the height
      const captureHeight = formHeight + 50; // 50px buffer

      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: captureHeight,
        windowHeight: captureHeight,
        onclone: function(clonedDoc) {
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
              el.style.color = 'black';
              el.style.fontSize = '16px';
              el.textContent = el.textContent;
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '16px';
            }
          });
        }
      }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('styled-form-data.pdf');

        // Clean up
        document.body.removeChild(tempContainer);
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while generating the PDF. Please check the console for more details.');
        document.body.removeChild(tempContainer);
      });
    }

    // Use requestAnimationFrame to ensure all rendering is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        generatePDF();
      });
    });
  });
});
