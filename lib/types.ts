export interface Question {
    id: number;
    text: string;
    options: string[];
    correct_option: number;
    marks: number;
}