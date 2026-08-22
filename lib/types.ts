export interface Question {
    id: number;
    text: string;
    options: string[];
    correct_option: number;
    marks: number;
};

export interface AssessmentWithQuestions {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    starts_at: string;
    ends_at: string;
    show_result: boolean;
    questions: {
        id: number;
        text: string;
        options: string[];
        correct_option: number;
        marks: number;
        order_index: number;
    }[];
};