import { HTMLAttributes } from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

/** Reusable table with consistent styling */
export function Table({ headers, children, emptyMessage = "No data found", isEmpty = false }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-8 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Table row component */
export function TableRow({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={["hover:bg-gray-50 transition-colors", className].join(" ")}
      {...props}
    >
      {children}
    </tr>
  );
}

/** Table cell component */
export function TableCell({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["px-4 py-3 text-gray-700", className].join(" ")}
      {...props}
    >
      {children}
    </td>
  );
}
