document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');

  // Add custom CSS to the page to improve input rendering
  const style = document.createElement('style');
  style.textContent = `
    .pdf-input {
      min-height: 30px !important;
      line-height: 1.5 !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      resize: none !important;
      width: 100% !important;
    }
    .pdf-text-wrapper {
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
  `;
  document.head.appendChild(style);

  // Function to wrap text
  function wrapText(text, maxWidth) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '16px Arial'; // Adjust font as needed

    let result = '';
    let line = '';
    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        result += line.trim() + '\n';
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    result += line.trim();
    return result;
  }

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, and textarea elements
    form.querySelectorAll('input, select, textarea').forEach(el => {
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

    // Process each input in the cloned form
    clonedForm.querySelectorAll('.pdf-input').forEach(el => {
      if (el.value) {
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-text-wrapper';
        wrapper.style.width = el.offsetWidth + 'px';
        wrapper.textContent = wrapText(el.value, el.offsetWidth - 10); // -10 for padding
        el.parentNode.insertBefore(wrapper, el.nextSibling);
        el.style.display = 'none';
      }
    });

    // Delay to ensure everything is rendered properly
    setTimeout(() => {
      const formHeight = tempContainer.scrollHeight;
      const formWidth = tempContainer.offsetWidth;
      const aspectRatio = formHeight / formWidth;

      // Set up PDF dimensions
      const { jsPDF } = window.jspdf;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = pdfWidth * aspectRatio;
      const doc = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: formHeight,
        windowHeight: formHeight
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save('styled-form-data.pdf');

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
    }, 100);
  });
});
