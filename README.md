# Resume Canvas 📄

<div align="center">

![Resume Canvas Preview](public/preview-light.png)

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)

</div>

## 🚀 Overview

**Resume Canvas** is a modern, open-source resume builder designed to be simple, fast, and privacy-focused. Build your professional resume in minutes with a real-time preview and export it as a high-quality PDF.

Unlike other resume builders, **Resume Canvas** runs entirely in your browser. Your data never leaves your device unless you choose to share it. No sign-ups, no paywalls, no tracking.

## ✨ Features

- **👀 Real-time Preview:** See your changes instantly as you type.
- **🔒 Privacy First:** Your resume is stored locally in your browser (Local Storage) and is never uploaded as you write.
- **🔗 Share Links:** Send someone a read-only link. The resume is encrypted in the browser and the decryption key travels in the URL fragment, so the server stores a blob it cannot read. Links expire on a schedule you choose.
- **📄 PDF Export:** High-quality, selectable, and ATS-friendly PDF generation using `@react-pdf/renderer`.
- **🎨 Customization:**
  - Multiple fonts (Google Fonts integration).
  - Custom theme colors.
  - Adjustable font sizes and document margins.
- **🌗 Dark/Light Mode:** Fully supported dark mode for late-night editing.
- **📱 Responsive Design:** Edit your resume on the go with a mobile-friendly interface.
- **🧩 Drag & Drop:** Reorder sections easily (Coming Soon).

## 📸 Screenshots

|                             Light Mode                             |                            Dark Mode                             |
| :----------------------------------------------------------------: | :--------------------------------------------------------------: |
| <img src="public/preview-light.png" alt="Light Mode" width="400"/> | <img src="public/preview-dark.png" alt="Dark Mode" width="400"/> |

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) & [Lucide React](https://lucide.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **PDF Generation:** [@react-pdf/renderer](https://react-pdf.org/)
- **Forms:** React Hook Form

## 🏁 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- Node.js 18+ installed
- pnpm (recommended), npm, or yarn

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/kstmostofa/resume-canvas.git
    cd resume-canvas
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Configure share links (optional locally, required in production):**

    ```bash
    cp .env.example .env.local
    ```

    Point it at any Upstash-compatible Redis REST endpoint. Left blank, the
    app falls back to an in-process store so sharing still works while you
    develop; a production build refuses to create links without it rather
    than handing out ones that would silently break.

4.  **Run the development server:**

    ```bash
    pnpm dev
    # or
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for the beautiful component library.
- [React PDF](https://react-pdf.org/) for the powerful PDF rendering engine.
- [Lucide](https://lucide.dev/) for the clean icons.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/kstmostofa">Md Mostafijur Rahman</a>
</div>
