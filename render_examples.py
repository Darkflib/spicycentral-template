#!/usr/bin/env python3
# render_examples.py - Renders example Jinja2 templates to static HTML files.

import os
import pathlib
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Project root directory
BASE_DIR = pathlib.Path(__file__).resolve().parent

# Output directory for rendered HTML files
OUTPUT_DIR = BASE_DIR / "dist"

# Templates directory
TEMPLATE_DIR = BASE_DIR / "templates"

def main():
    """
    Renders Jinja2 templates into static HTML files using placeholder context data and saves them to the output directory.
    
    This function sets up the Jinja2 environment, defines a mock URL resolver for static assets, prepares context data for specific templates, and writes the rendered HTML files to the designated output directory. It prints progress and instructions for viewing the generated files.
    """
    print(f"Initializing Jinja2 environment with template directory: {TEMPLATE_DIR}")
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(['html', 'xml']) # Enable autoescaping for security
    )

    # Mock url_for for static asset paths.
    # In a web framework (like Flask or Django), url_for dynamically generates URLs.
    # For static rendering, we need to define how these paths are resolved.
    # This mock assumes that the 'dist' directory is a sibling to 'static'.
    def mock_url_for(endpoint, filename=''):
        """
        Generate a relative URL for static assets or fallback links, simulating the behaviour of a web framework's `url_for`.
        
        Parameters:
        	endpoint (str): The endpoint name, typically 'static' for static assets.
        	filename (str, optional): The asset filename or path.
        
        Returns:
        	str: A relative URL suitable for use in rendered HTML files.
        """
        if endpoint == 'static':
            # Path from an HTML file in 'dist/' to an asset in 'static/'
            # e.g., dist/home.html needs to link to ../static/css/themes.css
            return f"../static/{filename}"
        # Fallback for other uses of url_for, if any (e.g., linking between pages)
        # For this script, we primarily care about static assets.
        # If page-to-page links were done with url_for, they'd need different handling (e.g. return filename).
        return f"{filename if filename else '#'}"

    env.globals['url_for'] = mock_url_for


    # Define pages to render: maps template file path (relative to TEMPLATE_DIR)
    # to the desired output HTML file name (in OUTPUT_DIR).
    pages_to_render = {
        "pages/home.html": "home.html",
        "pages/profile.html": "profile.html",
        "pages/article.html": "article.html",
        "pages/auth.html": "auth.html",
    }

    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")

    # Placeholder contexts for templates that might expect them
    # These would typically come from a database or application logic
    placeholder_contexts = {
        "pages/profile.html": {
            "user": {
                "name": "Alex Doe (Rendered)",
                "avatar": "https://via.placeholder.com/128/007bff/ffffff?text=ADR",
                "email": "alex.doe.rendered@example.com",
                "bio": "This profile was rendered by the render_examples.py script. Loves Python and Jinja.",
                "recent_activity": [
                    {"title": "Generated Static Page", "content": "Successfully rendered profile.html!", "link_url": "#", "image_url": "https://via.placeholder.com/300x150/28a745/ffffff?text=Render"},
                    {"title": "Ready for Review", "content": "This static site is ready for review.", "link_url": "#"}
                ]
            }
        },
        "pages/article.html": {
            "article": {
                "title": "Static Site Generation with Jinja",
                "publication_date": "October 27, 2023",
                "author": {
                    "name": "Py Script",
                    "avatar": "https://via.placeholder.com/48/6610f2/ffffff?text=PS",
                    "profile_url": "#pyscript"
                },
                "content_html": """
                    <p class="lead">This article page was rendered using the <code>render_examples.py</code> script.</p>
                    <p>Jinja2's powerful templating engine allows for the creation of dynamic HTML content which can then be "baked" into static files. This is useful for previews, simple static sites, or even as part of a larger static site generation (SSG) pipeline.</p>
                    <h3>Benefits</h3>
                    <ul>
                        <li><strong>Performance:</strong> Static files are fast to serve.</li>
                        <li><strong>Security:</strong> Reduced attack surface compared to dynamic applications.</li>
                        <li><strong>Simplicity:</strong> Easy to deploy and manage.</li>
                    </ul>
                """,
                "video_url": "https://www.youtube.com/watch?v=L_LUpnjgPso" # Example Jinja2 tutorial
            }
        }
        # home.html and auth.html might not need specific top-level context beyond what's in base.html or macros
    }

    print("\nRendering pages...")
    for template_file, output_file in pages_to_render.items():
        try:
            template = env.get_template(template_file)
            context = placeholder_contexts.get(template_file, {})

            rendered_html = template.render(context)

            output_path = OUTPUT_DIR / output_file
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(rendered_html)
            print(f"  Successfully rendered {template_file} to {output_path}")

        except Exception as e:
            print(f"  ERROR rendering {template_file}: {e}")

    print("\nScript finished.")
    print(f"To view the files, open them from the '{OUTPUT_DIR.name}' directory in your browser.")
    print("You can serve the 'dist' directory locally using Python's built-in HTTP server:")
    print(f"  cd {BASE_DIR}")
    print(f"  python -m http.server --directory {OUTPUT_DIR.name}")
    print("Then open http://localhost:8000 in your browser.")
    print("Alternatively, directly open the .html files (e.g., file://{OUTPUT_DIR}/home.html).")


if __name__ == "__main__":
    main()
    # To make this script executable directly (e.g., `./render_examples.py` on Unix-like systems):
    # 1. Ensure the shebang `#!/usr/bin/env python3` is at the top of the file. (Done)
    # 2. Make the file executable: `chmod +x render_examples.py` in your terminal.
    # This script is typically run as `python render_examples.py`.
