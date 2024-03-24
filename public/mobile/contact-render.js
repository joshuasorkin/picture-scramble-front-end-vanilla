function renderContact(contactInfo) {
    // Find the container where the contact info will be displayed
    const contactLinks = document.getElementById('contactLinks');
  
    // Clear previous content
    contactLinks.innerHTML = '';
    // Add a title at the top
    let titleHtml = '<h2 style="text-align: center; margin-top: 0;">Artist</h2>';
    contactLinks.innerHTML = titleHtml;
  
    // Check if contactInfo is null, undefined or empty
    if (contactInfo == null || Object.keys(contactInfo).length === 0) {
      contactLinks.innerHTML += `<div style="text-align: center;"><a href="${default_contact_info}" target="_blank">${default_contact_info}</a></div>`;
      return;
  }

    // Iterate through the contactInfo object
    for (const [key, value] of Object.entries(contactInfo)) {
      let htmlContent = '';
  
      switch (key) {
        case 'name':
          // For 'name', create a simple paragraph
          htmlContent = `<p><strong>Name:</strong> ${value}</p>`;
          break;
        case 'phone':
          // For 'phone', create a clickable link
          htmlContent = `<p><strong>Phone:</strong> <a href="tel:${value}">${value}</a></p>`;
          break;
        default:
          // For social media (default case), create a clickable link
          // Assume the key is the social media platform name, and the value is the user handle or ID
          const url = `https://${key}.com/${value}`;
          htmlContent = `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> <a href="${url}" target="_blank">${value}</a></p>`;
      }
  
      // Append the content to the contactContent element
      contactLinks.innerHTML += htmlContent;
    }
  }
  