document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitBtn');
  const inputDiv = document.getElementById('input-div');

  // Add custom CSS to the page to improve input rendering
  const style = document.createElement('style');
  style.textContent = `
    .pdf-input {
      min-height: 30px !important;
      line-height: 30px !important;
      padding: 5px !important;
      margin-bottom: 5px !important;
      border: 1px solid #ccc !important;
      box-sizing: border-box !important;
      overflow: hidden; /* Prevent scrollbars */
      resize: none; /* Disable manual resizing */
    }
    #input-div {
      border: 1px solid #ccc;
      padding: 5px;
      min-height: 30px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.5;
      max-height: 300px; /* Optional: set a maximum height */
      overflow-y: auto; /* Add scrollbar if content exceeds max-height */
      box-sizing: border-box;
      }
  `;
  document.head.appendChild(style);

  // Function to adjust height of contenteditable div
  function adjustHeight() {
    inputDiv.style.height = 'auto';
    inputDiv.style.height = inputDiv.scrollHeight + 'px';
  }

  // Event listeners for contenteditable div
  inputDiv.addEventListener('input', adjustHeight);
  inputDiv.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  inputDiv.addEventListener('mousedown', function(e) {
    e.preventDefault();
    this.focus();
  });

  // Initial call to set the correct height
  adjustHeight();

  // Function to auto-resize textareas
  function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    });
  }

  // Initialize auto-resizing on textareas
  autoResizeTextareas();

  submitBtn.addEventListener('click', function(event) {
    event.preventDefault();

    const form = document.querySelector('form');

    // Apply custom class to all input, select, textarea, and contenteditable elements
    form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
      el.classList.add('pdf-input');
    });

    // Get the full height of the form
    const formHeight = form.scrollHeight;
    const formWidth = form.offsetWidth;

    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = formWidth + 'px';
    tempContainer.style.height = formHeight + 'px';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.pointerEvents = 'none';

    // Clone the form and append it to the temporary container
    const clonedForm = form.cloneNode(true);
    tempContainer.appendChild(clonedForm);
    document.body.appendChild(tempContainer);

    // Delay to ensure everything is rendered properly
    setTimeout(() => {
      // Capture the screenshot
      document.addEventListener('DOMContentLoaded', function() {
        const submitBtn = document.getElementById('submitBtn');
        const inputDiv = document.getElementById('input-div');
      
        // Add custom CSS to the page to improve input rendering
        const style = document.createElement('style');
        style.textContent = `
          .pdf-input {
            min-height: 30px !important;
            line-height: 30px !important;
            padding: 5px !important;
            margin-bottom: 5px !important;
            border: 1px solid #ccc !important;
            box-sizing: border-box !important;
            overflow: hidden; /* Prevent scrollbars */
            resize: none; /* Disable manual resizing */
          }
          #input-div {
            border: 1px solid #ccc;
            padding: 5px;
            min-height: 30px;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.5;
            max-height: 300px; /* Optional: set a maximum height */
            overflow-y: auto; /* Add scrollbar if content exceeds max-height */
          }
        `;
        document.head.appendChild(style);
      
        // Function to adjust height of contenteditable div
        function adjustHeight() {
          inputDiv.style.height = 'auto';
          inputDiv.style.height = inputDiv.scrollHeight + 'px';
        }
      
        // Event listeners for contenteditable div
        inputDiv.addEventListener('input', adjustHeight);
        inputDiv.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        });
        inputDiv.addEventListener('mousedown', function(e) {
          e.preventDefault();
          this.focus();
        });
      
        // Initial call to set the correct height
        adjustHeight();
      
        // Function to auto-resize textareas
        function autoResizeTextareas() {
          const textareas = document.querySelectorAll('textarea');
          textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
              this.style.height = 'auto';
              this.style.height = this.scrollHeight + 'px';
            });
          });
        }
      
        // Initialize auto-resizing on textareas
        autoResizeTextareas();
      
        submitBtn.addEventListener('click', function(event) {
          event.preventDefault();
      
          const form = document.querySelector('form');
      
          // Apply custom class to all input, select, textarea, and contenteditable elements
          form.querySelectorAll('input, select, textarea, [contenteditable="true"]').forEach(el => {
            el.classList.add('pdf-input');
          });
      
          // Get the full height of the form
          const formHeight = form.scrollHeight;
          const formWidth = form.offsetWidth;
      
          // Create a temporary container
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.top = '0';
          tempContainer.style.left = '0';
          tempContainer.style.width = formWidth + 'px';
          tempContainer.style.height = formHeight + 'px';
          tempContainer.style.overflow = 'hidden';
          tempContainer.style.pointerEvents = 'none';
      
          // Clone the form and append it to the temporary container
          const clonedForm = form.cloneNode(true);
          tempContainer.appendChild(clonedForm);
          document.body.appendChild(tempContainer);
      
          // Delay to ensure everything is rendered properly
          setTimeout(() => {
            // Capture the screenshot
            html2canvas(tempContainer, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              height: formHeight,
              windowHeight: formHeight,
              onclone: function(clonedDoc) {
                // Ensure text is visible in cloned inputs and contenteditable divs
                clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
                  if (el.getAttribute('contenteditable') === 'true') {
                    el.style.color = 'black';
                    el.style.fontSize = '16px';
                    // Ensure the content of the div is preserved
                    el.textContent = el.textContent;
                  } else if (el.value) {
                    el.style.color = 'black';
                    el.style.fontSize = '16px';
                  }
                });
              }
            }).then(canvas => {
              // Create a PNG image from the canvas
              const imgData = canvas.toDataURL('image/png');
      
              // Create a link to download the image
              const link = document.createElement('a');
              link.href = imgData;
              link.download = 'styled-form-data.png'; // Set the name for the downloaded file
              link.click(); // Programmatically click the link to trigger the download
      
              // Remove the temporary container
              document.body.removeChild(tempContainer);
              
              // Remove custom class from original form elements
              form.querySelectorAll('.pdf-input').forEach(el => {
                el.classList.remove('pdf-input');
              });
            }).catch(error => {
              console.error('Error in html2canvas operation:', error);
              alert('An error occurred while capturing the image. Please check the console for more details.');
              
              // Remove the temporary container in case of error
              document.body.removeChild(tempContainer);
              
              // Remove custom class from original form elements
              form.querySelectorAll('.pdf-input').forEach(el => {
                el.classList.remove('pdf-input');
              });
            });
          }, 100); // Adjust the delay if necessary
        });
      });
      (tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: formHeight,
        windowHeight: formHeight,
        onclone: function(clonedDoc) {
          // Ensure text is visible in cloned inputs and contenteditable divs
          clonedDoc.querySelectorAll('.pdf-input').forEach(el => {
            if (el.getAttribute('contenteditable') === 'true') {
              el.style.color = 'black';
              el.style.fontSize = '16px';
              // Ensure the content of the div is preserved
              el.textContent = el.textContent;
            } else if (el.value) {
              el.style.color = 'black';
              el.style.fontSize = '16px';
            }
          });
        }
      }).then(canvas => {
        // Create a PNG image from the canvas
        const imgData = canvas.toDataURL('image/png');

        // Create a link to download the image
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'styled-form-data.png'; // Set the name for the downloaded file
        link.click(); // Programmatically click the link to trigger the download

        // Remove the temporary container
        document.body.removeChild(tempContainer);
        
        // Remove custom class from original form elements
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      }).catch(error => {
        console.error('Error in html2canvas operation:', error);
        alert('An error occurred while capturing the image. Please check the console for more details.');
        
        // Remove the temporary container in case of error
        document.body.removeChild(tempContainer);
        
        // Remove custom class from original form elements
        form.querySelectorAll('.pdf-input').forEach(el => {
          el.classList.remove('pdf-input');
        });
      });
    }, 100); // Adjust the delay if necessary
  });
});
