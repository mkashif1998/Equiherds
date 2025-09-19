
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

export const uploadFile = async (file) => {
    const authToken = getToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${authToken}`
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};   