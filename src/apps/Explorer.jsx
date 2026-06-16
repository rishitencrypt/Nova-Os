import { useState } from "react";

function Explorer() {
  const fileSystem = {
    Desktop: [
      { name: "NovaOS.lnk", type: "Shortcut", size: "2 KB" },
      { name: "Homework.docx", type: "Document", size: "24 KB" },
    ],

    Documents: [
      { name: "Physics Notes.pdf", type: "PDF", size: "1.2 MB" },
      { name: "Business Plan.docx", type: "Document", size: "480 KB" },
    ],

    Downloads: [
      { name: "Wallpaper.jpg", type: "Image", size: "3.4 MB" },
      { name: "Setup.exe", type: "Application", size: "12 MB" },
    ],

    Projects: [
      { name: "NovaOS", type: "Folder", size: "--" },
      { name: "SnapBooks", type: "Folder", size: "--" },
    ],

    Images: [
      { name: "space.jpg", type: "Image", size: "2.8 MB" },
      { name: "logo.png", type: "Image", size: "420 KB" },
    ],
  };

  const [folder, setFolder] =
    useState("Desktop");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const files =
    fileSystem[folder].filter((file) =>
      file.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        color: "white",
      }}
    >
      {/* SIDEBAR */}

      <div
        style={{
          width: "180px",
          borderRight:
            "1px solid rgba(255,255,255,.08)",
          padding: "12px",
        }}
      >
        <h3>Explorer</h3>

        {Object.keys(fileSystem).map(
          (item) => (
            <div
              key={item}
              onClick={() => {
                setFolder(item);
                setSelectedFile(null);
              }}
              style={{
                padding: "10px",
                marginBottom: "6px",
                borderRadius: "10px",
                cursor: "pointer",
                background:
                  folder === item
                    ? "rgba(255,255,255,.1)"
                    : "transparent",
              }}
            >
              📁 {item}
            </div>
          )
        )}
      </div>

      {/* MAIN */}

      <div
        style={{
          flex: 1,
          padding: "15px",
        }}
      >
        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            background:
              "rgba(255,255,255,.08)",
            color: "white",
          }}
        />

        {files.map((file) => (
          <div
            key={file.name}
            onClick={() =>
              setSelectedFile(file)
            }
            style={{
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "6px",
              cursor: "pointer",
              background:
                selectedFile?.name ===
                file.name
                  ? "rgba(79,70,229,.25)"
                  : "rgba(255,255,255,.04)",
            }}
          >
            {file.type === "Folder"
              ? "📁"
              : "📄"}{" "}
            {file.name}
          </div>
        ))}
      </div>

      {/* DETAILS */}

      <div
        style={{
          width: "220px",
          borderLeft:
            "1px solid rgba(255,255,255,.08)",
          padding: "15px",
        }}
      >
        <h3>Details</h3>

        {selectedFile ? (
          <>
            <p>
              <strong>Name:</strong>
              <br />
              {selectedFile.name}
            </p>

            <p>
              <strong>Type:</strong>
              <br />
              {selectedFile.type}
            </p>

            <p>
              <strong>Size:</strong>
              <br />
              {selectedFile.size}
            </p>

            <p>
              <strong>Status:</strong>
              <br />
              Synced
            </p>
          </>
        ) : (
          <p>
            Select a file to view
            details
          </p>
        )}
      </div>
    </div>
  );
}

export default Explorer;