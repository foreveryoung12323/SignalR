import React,{useState} from "react";
import API from '../utils/api';
const CreatePost = ({onPostCreated}) => {
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Создаем объект FormData для отправки данных с файлом
        const formData = new FormData();
        formData.append("content", content);
        if (image) {
            formData.append("image", image);
        }
        try{
            await API.post("/posts", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            setContent("");// очищаем поле ввода текста
            setImage(null);
            onPostCreated(); // уведомляем родительский компонент о создании поста
        }
        catch(err){
            setError("Could not create the post");
        }
        finally{
            setLoading(false);
        }
    };
    return(
  <div style={{ 
            backgroundColor: "#fff", 
            padding: "20px", 
            borderRadius: "12px", 
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            marginBottom: "30px" 
        }}>
            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="Что у вас нового?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    style={{ 
                        width: "100%", 
                        height: "80px", 
                        borderRadius: "8px", 
                        padding: "10px", 
                        border: "1px solid #ddd",
                        resize: "none",
                        fontFamily: "inherit"
                    }}
                />
                
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setImage(e.target.files[0])}
                        style={{ fontSize: "14px" }}
                    />
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            padding: "8px 20px", 
                            backgroundColor: "#007bff", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "20px",
                            cursor: "pointer"
                        }}
                    >
                        {loading ? "Публикация..." : "Опубликовать"}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default CreatePost;
