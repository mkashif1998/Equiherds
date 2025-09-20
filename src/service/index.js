
const baseUrl = "http://localhost:3000";

const getToken = () => {
    const token = localStorage.getItem("token");
    return token;
};

export const getRequest = async (url) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    });
    const data = await response.json();
    return data;
}

export const postRequest = async (url, data) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return responseData;
}

export const putRequest = async (url, data) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return responseData;
}

export const deleteRequest = async (url) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    return data;
}


// Upload a single file to the external documents-upload API and return the first URL string
export const uploadFile = async (file) => {
    if (!file) {
        throw new Error("No file provided");
    }

    const formData = new FormData();
    // Most document upload APIs accept 'files' for multiple; this will work for single too
    formData.append('files', file);

    const response = await fetch('https://lms-api.wiserbee.ca/api/Document/documents-upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    // Expected response: ["https://.../file.png"]
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'string') {
        return result[0];
    }

    throw new Error("Unexpected upload response");
}

