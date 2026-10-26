

function Button({text, onCall}) {

    return (
        <div className="Button">
            <button onClick={onCall}>{text}</button>

        </div>
        
        )

}

export default Button